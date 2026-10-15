import { execSync } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const TEST_DB = process.env.TEST_DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/beautybook_test";
process.env.DATABASE_URL = TEST_DB;

const { db } = await import("@/lib/db");
const { ImageError, addGalleryImage, setAboutImage, deleteImage, moveGalleryImage, pageImages, setCoverImage, setServiceImage, sniffImageType } = await import("@/server/images");

// Smallest valid-looking headers for each accepted type.
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP = new Uint8Array([...Buffer.from("RIFF"), 0, 0, 0, 0, ...Buffer.from("WEBP")]);

async function makeBusiness(slug: string) {
  const user = await db.user.create({ data: { email: `${slug}@img.test.local`, name: slug, passwordHash: "x" } });
  return db.business.create({
    data: { ownerId: user.id, slug, name: slug, services: { create: [{ name: "Facial", durationMin: 60, priceAgorot: 20000 }] } },
    include: { services: true },
  });
}

let a: Awaited<ReturnType<typeof makeBusiness>>;
let b: Awaited<ReturnType<typeof makeBusiness>>;

beforeAll(async () => {
  execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: TEST_DB }, stdio: "ignore" });
  await db.user.deleteMany({ where: { email: { endsWith: "@img.test.local" } } });
  a = await makeBusiness("img-a");
  b = await makeBusiness("img-b");
});

afterAll(async () => {
  await db.user.deleteMany({ where: { email: { endsWith: "@img.test.local" } } });
  await db.$disconnect();
});

describe("image validation", () => {
  it("recognises JPEG, PNG and WEBP by their bytes", () => {
    expect(sniffImageType(JPEG)).toBe("image/jpeg");
    expect(sniffImageType(PNG)).toBe("image/png");
    expect(sniffImageType(WEBP)).toBe("image/webp");
  });

  it("refuses files that are not images, whatever their name", async () => {
    const html = new Uint8Array(Buffer.from("<script>alert(1)</script>"));
    await expect(addGalleryImage(a.id, html)).rejects.toBeInstanceOf(ImageError);
  });
});

describe("page photos", () => {
  it("keeps a single cover photo per business", async () => {
    await setCoverImage(a.id, JPEG);
    const second = await setCoverImage(a.id, PNG);
    const covers = await db.image.findMany({ where: { businessId: a.id, kind: "COVER" } });
    expect(covers.map((c) => c.id)).toEqual([second.id]);
    expect(covers[0].mime).toBe("image/png");
  });

  it("keeps a single portrait per business, apart from the cover", async () => {
    await setAboutImage(a.id, JPEG);
    const second = await setAboutImage(a.id, WEBP);
    const portraits = await db.image.findMany({ where: { businessId: a.id, kind: "ABOUT" } });
    expect(portraits.map((p) => p.id)).toEqual([second.id]);
    expect((await pageImages(a.id)).aboutId).toBe(second.id);
    expect((await pageImages(a.id)).coverId).not.toBe(second.id);
  });

  it("will not attach a photo to another business's service", async () => {
    await expect(setServiceImage(a.id, b.services[0].id, JPEG)).rejects.toThrow("השירות לא נמצא");
  });

  it("cannot delete another business's photo", async () => {
    const img = await addGalleryImage(b.id, JPEG);
    expect(await deleteImage(a.id, img.id)).toBe(false);
    expect(await db.image.findUnique({ where: { id: img.id } })).not.toBeNull();
    expect(await deleteImage(b.id, img.id)).toBe(true);
  });

  it("reorders the gallery", async () => {
    const first = await addGalleryImage(a.id, JPEG);
    const second = await addGalleryImage(a.id, JPEG);
    expect((await pageImages(a.id)).gallery).toEqual([first.id, second.id]);
    await moveGalleryImage(a.id, second.id, -1);
    expect((await pageImages(a.id)).gallery).toEqual([second.id, first.id]);
  });
});
