import { db } from "@/lib/db";

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_GALLERY_IMAGES = 30;

export class ImageError extends Error {}

/** Detects the real type from the file's first bytes; the browser's claim is not trusted. */
export function sniffImageType(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

function validate(bytes: Uint8Array) {
  if (bytes.length === 0) throw new ImageError("לא נבחרה תמונה");
  if (bytes.length > MAX_IMAGE_BYTES) throw new ImageError("התמונה גדולה מדי (עד 4MB)");
  const mime = sniffImageType(bytes);
  if (!mime) throw new ImageError("אפשר להעלות רק תמונות JPG, PNG או WEBP");
  return { mime, data: Buffer.from(bytes), sizeBytes: bytes.length };
}

/** Replaces a photo the business has only one of: the cover or the owner's portrait. */
async function setSingleImage(businessId: string, kind: "COVER" | "ABOUT", bytes: Uint8Array) {
  const file = validate(bytes);
  return db.$transaction(async (tx) => {
    await tx.image.deleteMany({ where: { businessId, kind } });
    return tx.image.create({ data: { businessId, kind, ...file }, select: { id: true } });
  });
}

export const setCoverImage = (businessId: string, bytes: Uint8Array) => setSingleImage(businessId, "COVER", bytes);
export const setAboutImage = (businessId: string, bytes: Uint8Array) => setSingleImage(businessId, "ABOUT", bytes);

export async function addGalleryImage(businessId: string, bytes: Uint8Array) {
  const file = validate(bytes);
  const count = await db.image.count({ where: { businessId, kind: "GALLERY" } });
  if (count >= MAX_GALLERY_IMAGES) throw new ImageError(`אפשר עד ${MAX_GALLERY_IMAGES} תמונות בגלריה`);
  const last = await db.image.findFirst({ where: { businessId, kind: "GALLERY" }, orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
  return db.image.create({ data: { businessId, kind: "GALLERY", sortOrder: (last?.sortOrder ?? -1) + 1, ...file }, select: { id: true } });
}

/** Sets the photo shown on a service's tile. The service must belong to the business. */
export async function setServiceImage(businessId: string, serviceId: string, bytes: Uint8Array) {
  const file = validate(bytes);
  const service = await db.service.findFirst({ where: { id: serviceId, businessId }, select: { id: true } });
  if (!service) throw new ImageError("השירות לא נמצא");
  return db.$transaction(async (tx) => {
    await tx.image.deleteMany({ where: { serviceId } });
    return tx.image.create({ data: { businessId, kind: "SERVICE", serviceId, ...file }, select: { id: true } });
  });
}

/** Deletes one of the business's photos; false when it is not theirs. */
export async function deleteImage(businessId: string, imageId: string) {
  const res = await db.image.deleteMany({ where: { id: imageId, businessId } });
  return res.count > 0;
}

/** Moves a gallery photo one place earlier (-1) or later (+1). */
export async function moveGalleryImage(businessId: string, imageId: string, direction: -1 | 1) {
  const images = await db.image.findMany({
    where: { businessId, kind: "GALLERY" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  const from = images.findIndex((i) => i.id === imageId);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= images.length) return false;
  [images[from], images[to]] = [images[to], images[from]];
  await db.$transaction(images.map((img, i) => db.image.update({ where: { id: img.id }, data: { sortOrder: i } })));
  return true;
}

/** Ids only (never the bytes) of everything the public page shows. */
export async function pageImages(businessId: string) {
  const rows = await db.image.findMany({
    where: { businessId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, kind: true, serviceId: true },
  });
  return {
    coverId: rows.find((r) => r.kind === "COVER")?.id ?? null,
    aboutId: rows.find((r) => r.kind === "ABOUT")?.id ?? null,
    gallery: rows.filter((r) => r.kind === "GALLERY").map((r) => r.id),
    byService: new Map(rows.filter((r) => r.serviceId).map((r) => [r.serviceId!, r.id])),
  };
}

export function imageUrl(id: string) {
  return `/img/${id}`;
}
