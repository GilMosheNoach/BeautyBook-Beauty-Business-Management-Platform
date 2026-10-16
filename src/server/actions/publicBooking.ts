"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "@/lib/zod";
import { db } from "@/lib/db";
import { isValidPhone } from "@/lib/phone";
import { rateLimit } from "@/lib/rateLimit";
import { localDateKey } from "@/lib/time";
import { availableSlots } from "@/server/availability";
import { createAppointment, SlotTakenError } from "@/server/appointments";

export type BookingResult = { ok: true; token: string; status: "PENDING" | "CONFIRMED" } | { ok: false; error: string; slotTaken?: boolean };

const bookingSchema = z.object({
  slug: z.string().min(1),
  serviceId: z.string().min(1),
  startsAt: z.string().datetime(),
  name: z.string().trim().min(2, "נא להזין שם מלא").max(80),
  phone: z.string().trim().refine(isValidPhone, "מספר טלפון לא תקין"),
  note: z.string().trim().max(500).default(""),
  invite: z.string().max(64).default(""),
  website: z.string().max(0).default(""), // honeypot: real users never fill it
});

export async function bookAppointmentAction(input: z.input<typeof bookingSchema>): Promise<BookingResult> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (!rateLimit(`book:${ip}`, 8, 10 * 60_000)) {
    return { ok: false, error: "יותר מדי ניסיונות. נסי שוב בעוד כמה דקות." };
  }

  const business = await db.business.findUnique({ where: { slug: d.slug } });
  if (!business) return { ok: false, error: "העסק לא נמצא" };
  const service = await db.service.findFirst({ where: { id: d.serviceId, businessId: business.id, active: true } });
  if (!service) return { ok: false, error: "השירות לא זמין" };

  // The requested start must be one of the currently offered slots, which
  // enforces working hours, notice, booking window and buffers server-side.
  const startsAt = new Date(d.startsAt);
  const slots = await availableSlots(business, service.durationMin, localDateKey(startsAt, business.timezone));
  if (!slots.some((s) => s.getTime() === startsAt.getTime())) {
    return { ok: false, error: "השעה הזו כבר לא פנויה. בחרי שעה אחרת.", slotTaken: true };
  }

  const invitation = d.invite
    ? await db.invitation.findFirst({ where: { token: d.invite, businessId: business.id, usedAt: null, expiresAt: { gt: new Date() } } })
    : null;

  const status = business.bookingMode === "AUTO" ? "CONFIRMED" : "PENDING";
  try {
    const appt = await createAppointment({
      businessId: business.id,
      serviceId: service.id,
      startsAt,
      client: { name: d.name, phone: d.phone },
      status,
      source: invitation ? "INVITE" : "ONLINE",
      note: d.note,
    });
    if (invitation) await db.invitation.update({ where: { id: invitation.id }, data: { usedAt: new Date() } });
    revalidatePath("/dashboard", "layout");
    return { ok: true, token: appt.manageToken, status };
  } catch (err) {
    if (err instanceof SlotTakenError) return { ok: false, error: "השעה הזו בדיוק נתפסה. בחרי שעה אחרת.", slotTaken: true };
    throw err;
  }
}

export async function cancelByClientAction(form: FormData) {
  const token = String(form.get("token") ?? "");
  const appt = await db.appointment.findUnique({ where: { manageToken: token }, include: { business: true } });
  if (!appt || !["PENDING", "CONFIRMED"].includes(appt.status) || appt.startsAt <= new Date()) return;
  await db.appointment.update({ where: { id: appt.id }, data: { status: "CANCELLED" } });
  revalidatePath(`/b/${appt.business.slug}/a/${token}`);
  revalidatePath("/dashboard", "layout");
}
