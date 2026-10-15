"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireBusiness } from "@/lib/session";
import {
  ImageError,
  addGalleryImage,
  deleteImage,
  moveGalleryImage,
  setCoverImage,
  setServiceImage,
} from "@/server/images";
import type { FormState } from "@/components/FormMessage";

function revalidate(slug: string) {
  revalidatePath("/dashboard/design");
  revalidatePath(`/b/${slug}`);
}

async function fileBytes(form: FormData) {
  const file = form.get("file");
  if (!(file instanceof File)) throw new ImageError("לא נבחרה תמונה");
  return new Uint8Array(await file.arrayBuffer());
}

/** Uploads one photo: kind = cover | gallery | service (with serviceId). */
export async function uploadImageAction(form: FormData): Promise<FormState> {
  const business = await requireBusiness();
  try {
    const bytes = await fileBytes(form);
    const kind = String(form.get("kind") ?? "");
    if (kind === "cover") await setCoverImage(business.id, bytes);
    else if (kind === "gallery") await addGalleryImage(business.id, bytes);
    else if (kind === "service") await setServiceImage(business.id, String(form.get("serviceId") ?? ""), bytes);
    else return { error: "סוג תמונה לא תקין" };
  } catch (e) {
    if (e instanceof ImageError) return { error: e.message };
    throw e;
  }
  revalidate(business.slug);
  return { ok: "התמונה נשמרה" };
}

export async function deleteImageAction(form: FormData) {
  const business = await requireBusiness();
  await deleteImage(business.id, String(form.get("id") ?? ""));
  revalidate(business.slug);
}

export async function moveImageAction(form: FormData) {
  const business = await requireBusiness();
  await moveGalleryImage(business.id, String(form.get("id") ?? ""), form.get("direction") === "-1" ? -1 : 1);
  revalidate(business.slug);
}

const textsSchema = z.object({
  tagline: z.string().trim().max(120, "שורת הפתיחה ארוכה מדי"),
  about: z.string().trim().max(1000, "הטקסט ארוך מדי"),
});

export async function updatePageTextsAction(_: FormState, form: FormData): Promise<FormState> {
  const business = await requireBusiness();
  const parsed = textsSchema.safeParse({ tagline: form.get("tagline") ?? "", about: form.get("about") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.business.update({ where: { id: business.id }, data: parsed.data });
  revalidate(business.slug);
  return { ok: "נשמר" };
}
