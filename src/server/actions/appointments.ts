"use server";

import type { AppointmentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireBusiness } from "@/lib/session";
import { isValidPhone } from "@/lib/phone";
import { hhmmToMinutes, isDateKey, localMinutesToDate } from "@/lib/time";
import { createAppointment, setAppointmentStatus, SlotTakenError } from "@/server/appointments";
import type { FormState } from "@/components/FormMessage";

const OWNER_STATUSES: AppointmentStatus[] = ["CONFIRMED", "REJECTED", "CANCELLED", "COMPLETED", "NO_SHOW"];

export async function changeStatusAction(form: FormData) {
  const business = await requireBusiness();
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "") as AppointmentStatus;
  if (!OWNER_STATUSES.includes(status)) return;
  try {
    await setAppointmentStatus(business.id, id, status);
  } catch (err) {
    if (!(err instanceof SlotTakenError)) throw err;
  }
  revalidatePath("/dashboard", "layout");
}

const manualSchema = z.object({
  serviceId: z.string().min(1, "נא לבחור שירות"),
  date: z.string().refine(isDateKey, "תאריך לא תקין"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "שעה לא תקינה"),
  clientId: z.string().optional().default(""),
  clientName: z.string().trim().optional().default(""),
  clientPhone: z.string().trim().optional().default(""),
  durationMin: z.coerce.number().int().min(5).max(600).optional(),
  note: z.string().max(500).optional().default(""),
});

export async function createManualAppointmentAction(_: FormState, form: FormData): Promise<FormState> {
  const business = await requireBusiness();
  const raw = Object.fromEntries(form);
  if (raw.durationMin === "") delete raw.durationMin;
  const parsed = manualSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  let client: { name: string; phone: string } | undefined;
  if (!d.clientId) {
    if (d.clientName.length < 2) return { error: "נא לבחור לקוחה קיימת או להזין שם" };
    if (!isValidPhone(d.clientPhone)) return { error: "מספר טלפון לא תקין" };
    client = { name: d.clientName, phone: d.clientPhone };
  }

  let id: string;
  try {
    const appt = await createAppointment({
      businessId: business.id,
      serviceId: d.serviceId,
      startsAt: localMinutesToDate(d.date, hhmmToMinutes(d.time), business.timezone),
      clientId: d.clientId || undefined,
      client,
      status: "CONFIRMED",
      source: "MANUAL",
      note: d.note,
      durationMin: d.durationMin,
    });
    id = appt.id;
  } catch (err) {
    if (err instanceof SlotTakenError) return { error: "יש כבר תור בשעה הזו. בחרי שעה אחרת." };
    if (err instanceof Error && err.message.endsWith("_NOT_FOUND")) return { error: "השירות או הלקוחה לא נמצאו" };
    throw err;
  }
  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/appointments/${id}?created=1`);
}
