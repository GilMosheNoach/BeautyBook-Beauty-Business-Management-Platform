"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireBusiness, requireUser } from "@/lib/session";
import { normalizeSlug, slugError } from "@/lib/slug";
import { DEFAULT_HOURS, STARTER_SERVICES } from "@/lib/starterServices";
import type { FormState } from "@/components/FormMessage";

const onboardingSchema = z.object({
  name: z.string().trim().min(2, "נא להזין את שם העסק").max(80),
  slug: z.string().transform(normalizeSlug),
  phone: z.string().trim().max(20).default(""),
  address: z.string().trim().max(120).default(""),
});

export async function createBusinessAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  if (user.business) redirect("/dashboard");

  const parsed = onboardingSchema.safeParse({
    name: form.get("name"),
    slug: form.get("slug") ?? "",
    phone: form.get("phone") ?? "",
    address: form.get("address") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, slug, phone, address } = parsed.data;
  const err = slugError(slug);
  if (err) return { error: err };
  if (await db.business.findUnique({ where: { slug } })) return { error: "הכתובת הזו כבר תפוסה, נסי אחרת" };

  const chosen = new Set(form.getAll("starter").map(String));
  const services = STARTER_SERVICES.filter((s) => chosen.has(s.key)).map((s, i) => ({
    name: s.name,
    durationMin: s.durationMin,
    priceAgorot: s.price * 100,
    sortOrder: i,
  }));

  await db.business.create({
    data: {
      ownerId: user.id,
      name,
      slug,
      phone,
      address,
      onboarded: true,
      workingHours: { create: DEFAULT_HOURS },
      services: { create: services },
    },
  });
  redirect("/dashboard?welcome=1");
}

const settingsSchema = z.object({
  name: z.string().trim().min(2, "נא להזין את שם העסק").max(80),
  slug: z.string().transform(normalizeSlug),
  about: z.string().trim().max(1000),
  phone: z.string().trim().max(20),
  address: z.string().trim().max(120),
  instagram: z.string().trim().max(60),
  bookingMode: z.enum(["AUTO", "APPROVAL"]),
  slotStepMin: z.coerce.number().int().refine((n) => [5, 10, 15, 20, 30, 60].includes(n), "מרווח לא תקין"),
  minNoticeMin: z.coerce.number().int().min(0).max(60 * 24 * 14),
  maxAdvanceDays: z.coerce.number().int().min(1, "לפחות יום אחד").max(365),
  bufferMin: z.coerce.number().int().min(0).max(120),
});

export async function updateSettingsAction(_: FormState, form: FormData): Promise<FormState> {
  const business = await requireBusiness();
  const parsed = settingsSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;
  const err = slugError(data.slug);
  if (err) return { error: err };
  if (data.slug !== business.slug && (await db.business.findUnique({ where: { slug: data.slug } }))) {
    return { error: "הכתובת הזו כבר תפוסה, נסי אחרת" };
  }
  await db.business.update({ where: { id: business.id }, data });
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/b/${data.slug}`);
  return { ok: "ההגדרות נשמרו" };
}
