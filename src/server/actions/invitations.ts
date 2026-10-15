"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireBusiness } from "@/lib/session";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { newToken } from "@/lib/tokens";

export type InviteState = { error?: string; link?: string; phone?: string; text?: string } | undefined;

const inviteSchema = z.object({
  clientName: z.string().trim().max(80).default(""),
  clientPhone: z.string().trim().max(20).default(""),
  serviceId: z.string().default(""),
  message: z.string().trim().max(500).default(""),
  validDays: z.coerce.number().int().min(1).max(90).default(14),
});

export async function createInvitationAction(_: InviteState, form: FormData): Promise<InviteState> {
  const business = await requireBusiness();
  const parsed = inviteSchema.safeParse({
    clientName: form.get("clientName") ?? "",
    clientPhone: form.get("clientPhone") ?? "",
    serviceId: form.get("serviceId") ?? "",
    message: form.get("message") ?? "",
    validDays: form.get("validDays") ?? 14,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (d.clientPhone && !isValidPhone(d.clientPhone)) return { error: "מספר טלפון לא תקין" };

  let service = null;
  if (d.serviceId) {
    service = await db.service.findFirst({ where: { id: d.serviceId, businessId: business.id } });
    if (!service) return { error: "השירות לא נמצא" };
  }

  const token = newToken(12);
  await db.invitation.create({
    data: {
      businessId: business.id,
      token,
      clientName: d.clientName,
      clientPhone: d.clientPhone ? normalizePhone(d.clientPhone) : "",
      serviceId: service?.id,
      message: d.message,
      expiresAt: new Date(Date.now() + d.validDays * 86_400_000),
    },
  });

  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const link = `${base}/b/${business.slug}?invite=${token}`;
  const greeting = d.clientName ? `היי ${d.clientName}! ` : "היי! ";
  const body = d.message || `מוזמנת לקבוע תור${service ? ` ל${service.name}` : ""} ב${business.name}.`;
  revalidatePath("/dashboard/invite");
  return { link, phone: d.clientPhone ? normalizePhone(d.clientPhone) : "", text: `${greeting}${body}\nלבחירת מועד: ${link}` };
}
