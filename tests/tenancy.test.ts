import { execSync } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const TEST_DB = process.env.TEST_DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/beautybook_test";
process.env.DATABASE_URL = TEST_DB;

// Imported after DATABASE_URL points at the test database.
const { db } = await import("@/lib/db");
const { createAppointment, setAppointmentStatus, SlotTakenError } = await import("@/server/appointments");

async function makeBusiness(slug: string) {
  const user = await db.user.create({ data: { email: `${slug}@test.local`, name: slug, passwordHash: "x" } });
  return db.business.create({
    data: {
      ownerId: user.id,
      slug,
      name: slug,
      services: { create: [{ name: "Facial", durationMin: 60, priceAgorot: 20000 }] },
    },
    include: { services: true },
  });
}

let a: Awaited<ReturnType<typeof makeBusiness>>;
let b: Awaited<ReturnType<typeof makeBusiness>>;
const start = new Date("2030-05-05T07:00:00Z");

beforeAll(async () => {
  execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: TEST_DB }, stdio: "ignore" });
  await db.user.deleteMany({ where: { email: { endsWith: "@test.local" } } });
  a = await makeBusiness("tenant-a");
  b = await makeBusiness("tenant-b");
});

afterAll(async () => {
  await db.user.deleteMany({ where: { email: { endsWith: "@test.local" } } });
  await db.$disconnect();
});

describe("tenant isolation", () => {
  it("refuses to book another business's service", async () => {
    await expect(
      createAppointment({ businessId: a.id, serviceId: b.services[0].id, startsAt: start, client: { name: "X", phone: "0501111111" }, status: "CONFIRMED", source: "MANUAL" }),
    ).rejects.toThrow("SERVICE_NOT_FOUND");
  });

  it("refuses to attach another business's client", async () => {
    const clientB = await db.client.create({ data: { businessId: b.id, name: "B client", phone: "0509999999" } });
    await expect(
      createAppointment({ businessId: a.id, serviceId: a.services[0].id, startsAt: start, clientId: clientB.id, status: "CONFIRMED", source: "MANUAL" }),
    ).rejects.toThrow("CLIENT_NOT_FOUND");
  });

  it("cannot change another business's appointment", async () => {
    const appt = await createAppointment({ businessId: b.id, serviceId: b.services[0].id, startsAt: start, client: { name: "Y", phone: "0502222222" }, status: "PENDING", source: "ONLINE" });
    expect(await setAppointmentStatus(a.id, appt.id, "CANCELLED")).toBe(false);
    expect((await db.appointment.findUnique({ where: { id: appt.id } }))?.status).toBe("PENDING");
  });

  it("keeps the same phone as separate clients per business", async () => {
    const t = new Date("2030-06-01T07:00:00Z");
    await createAppointment({ businessId: a.id, serviceId: a.services[0].id, startsAt: t, client: { name: "Same", phone: "+972 50-777-7777" }, status: "CONFIRMED", source: "ONLINE" });
    await createAppointment({ businessId: b.id, serviceId: b.services[0].id, startsAt: t, client: { name: "Same", phone: "0507777777" }, status: "CONFIRMED", source: "ONLINE" });
    const rows = await db.client.findMany({ where: { phone: "0507777777" } });
    expect(new Set(rows.map((r) => r.businessId))).toEqual(new Set([a.id, b.id]));
  });
});

describe("double booking", () => {
  it("lets only one of two concurrent bookings for the same slot through", async () => {
    const t = new Date("2030-07-01T07:00:00Z");
    const results = await Promise.allSettled(
      ["0503000001", "0503000002"].map((phone) =>
        createAppointment({ businessId: a.id, serviceId: a.services[0].id, startsAt: t, client: { name: "C", phone }, status: "PENDING", source: "ONLINE" }),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect(rejected.reason).toBeInstanceOf(SlotTakenError);
  });

  it("frees the slot once an appointment is cancelled", async () => {
    const t = new Date("2030-07-02T07:00:00Z");
    const first = await createAppointment({ businessId: a.id, serviceId: a.services[0].id, startsAt: t, client: { name: "D", phone: "0504000001" }, status: "CONFIRMED", source: "ONLINE" });
    await setAppointmentStatus(a.id, first.id, "CANCELLED");
    const second = await createAppointment({ businessId: a.id, serviceId: a.services[0].id, startsAt: t, client: { name: "E", phone: "0504000002" }, status: "CONFIRMED", source: "ONLINE" });
    expect(second.id).toBeTruthy();
    // Re-confirming the cancelled one would now overlap.
    await expect(setAppointmentStatus(a.id, first.id, "CONFIRMED")).rejects.toBeInstanceOf(SlotTakenError);
  });

  it("allows the same time at two different businesses", async () => {
    const t = new Date("2030-07-03T07:00:00Z");
    await createAppointment({ businessId: a.id, serviceId: a.services[0].id, startsAt: t, client: { name: "F", phone: "0505000001" }, status: "CONFIRMED", source: "ONLINE" });
    await expect(
      createAppointment({ businessId: b.id, serviceId: b.services[0].id, startsAt: t, client: { name: "F", phone: "0505000001" }, status: "CONFIRMED", source: "ONLINE" }),
    ).resolves.toBeTruthy();
  });
});
