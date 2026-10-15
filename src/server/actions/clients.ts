"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireBusiness } from "@/lib/session";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import type { FormState } from "@/components/FormMessage";

const clientSchema = z.object({
  name: z.string().trim().min(2, "נא להזין שם").max(80),
  phone: z.string().trim().refine(isValidPhone, "מספר טלפון לא תקין").transform(normalizePhone),
  email: z.string().trim().max(120).default(""),
  notes: z.string().trim().max(2000).default(""),
});

function parse(form: FormData) {
  return clientSchema.safeParse({
    name: form.get("name"),
    phone: form.get("phone") ?? "",
    email: form.get("email") ?? "",
    notes: form.get("notes") ?? "",
  });
}

function isUniqueViolation(err: unknown) {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

export async function createClientAction(_: FormState, form: FormData): Promise<FormState> {
  const business = await requireBusiness();
  const parsed = parse(form);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  let id: string;
  try {
    id = (await db.client.create({ data: { ...parsed.data, businessId: business.id } })).id;
  } catch (err) {
    if (isUniqueViolation(err)) return { error: "כבר יש לקוחה עם מספר הטלפון הזה" };
    throw err;
  }
  revalidatePath("/dashboard/clients");
  redirect(`/dashboard/clients/${id}`);
}

export async function updateClientAction(_: FormState, form: FormData): Promise<FormState> {
  const business = await requireBusiness();
  const parsed = parse(form);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const id = String(form.get("id") ?? "");
  try {
    const res = await db.client.updateMany({ where: { id, businessId: business.id }, data: parsed.data });
    if (!res.count) return { error: "הלקוחה לא נמצאה" };
  } catch (err) {
    if (isUniqueViolation(err)) return { error: "כבר יש לקוחה עם מספר הטלפון הזה" };
    throw err;
  }
  revalidatePath(`/dashboard/clients/${id}`);
  return { ok: "הפרטים נשמרו" };
}
