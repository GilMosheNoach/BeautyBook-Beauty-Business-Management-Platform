"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireBusiness } from "@/lib/session";
import { shekelsToAgorot } from "@/lib/money";
import type { FormState } from "@/components/FormMessage";

const serviceSchema = z.object({
  name: z.string().trim().min(2, "נא להזין שם שירות").max(80),
  description: z.string().trim().max(500).default(""),
  durationMin: z.coerce.number().int().min(5, "משך מינימלי 5 דקות").max(600),
  price: z.string().refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, "מחיר לא תקין"),
});

function revalidate(slug: string) {
  revalidatePath("/dashboard/services");
  revalidatePath(`/b/${slug}`);
}

export async function saveServiceAction(_: FormState, form: FormData): Promise<FormState> {
  const business = await requireBusiness();
  const parsed = serviceSchema.safeParse({
    name: form.get("name"),
    description: form.get("description") ?? "",
    durationMin: form.get("durationMin"),
    price: String(form.get("price") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = {
    name: parsed.data.name,
    description: parsed.data.description,
    durationMin: parsed.data.durationMin,
    priceAgorot: shekelsToAgorot(parsed.data.price),
  };
  const id = String(form.get("id") ?? "");
  if (id) {
    const res = await db.service.updateMany({ where: { id, businessId: business.id }, data });
    if (!res.count) return { error: "השירות לא נמצא" };
  } else {
    const count = await db.service.count({ where: { businessId: business.id } });
    await db.service.create({ data: { ...data, businessId: business.id, sortOrder: count } });
  }
  revalidate(business.slug);
  return { ok: id ? "השירות עודכן" : "השירות נוסף" };
}

export async function toggleServiceAction(form: FormData) {
  const business = await requireBusiness();
  const id = String(form.get("id") ?? "");
  const active = form.get("active") === "true";
  await db.service.updateMany({ where: { id, businessId: business.id }, data: { active } });
  revalidate(business.slug);
}

export async function deleteServiceAction(form: FormData) {
  const business = await requireBusiness();
  const id = String(form.get("id") ?? "");
  // Past appointments keep their name and price snapshot; serviceId becomes null.
  await db.service.deleteMany({ where: { id, businessId: business.id } });
  revalidate(business.slug);
}
