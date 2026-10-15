import { execSync } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { addDays, addMonths } from "date-fns";
import { hasAccess, priceFor } from "@/lib/billing";

const TEST_DB = process.env.TEST_DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/beautybook_test";
process.env.DATABASE_URL = TEST_DB;
process.env.BILLING_PROVIDER = "test";

// Imported after DATABASE_URL points at the test database.
const { db } = await import("@/lib/db");
const billing = await import("@/server/billing");

const EMAIL = "@billing.test.local";
let n = 0;

/** Signs up an owner (optionally through a referral link) and saves a card, starting the trial at `at`. */
async function owner(at: Date, ref?: string, card = "test_ok") {
  const user = await db.user.create({ data: { email: `o${++n}${EMAIL}`, name: `owner ${n}`, passwordHash: "x" } });
  const sub = await billing.createSubscription(user.id, ref);
  await db.subscription.update({ where: { id: sub.id }, data: { checkoutToken: `tok-${n}` } });
  return (await billing.completeCheckout(`tok-${n}`, { customerRef: `${card}_${n}`, last4: "4242" }, at))!;
}

beforeAll(async () => {
  execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: TEST_DB }, stdio: "ignore" });
  await db.user.deleteMany({ where: { email: { endsWith: EMAIL } } });
});

afterAll(async () => {
  await db.user.deleteMany({ where: { email: { endsWith: EMAIL } } });
  await db.$disconnect();
});

describe("pricing", () => {
  it("takes ₪100 per paying referral and never goes below zero", () => {
    expect(priceFor(0).totalAgorot).toBe(30000);
    expect(priceFor(1).totalAgorot).toBe(20000);
    expect(priceFor(3).totalAgorot).toBe(0);
    expect(priceFor(5).totalAgorot).toBe(0);
  });

  it("keeps access through a cancelled period and a short grace after a failed charge", () => {
    const now = new Date("2030-01-10T00:00:00Z");
    expect(hasAccess({ status: "INCOMPLETE", currentPeriodEnd: null }, now)).toBe(false);
    expect(hasAccess({ status: "CANCELED", currentPeriodEnd: addDays(now, 1) }, now)).toBe(true);
    expect(hasAccess({ status: "CANCELED", currentPeriodEnd: addDays(now, -1) }, now)).toBe(false);
    expect(hasAccess({ status: "PAST_DUE", currentPeriodEnd: addDays(now, -3) }, now)).toBe(true);
    expect(hasAccess({ status: "PAST_DUE", currentPeriodEnd: addDays(now, -8) }, now)).toBe(false);
  });
});

describe("trial and referrals", () => {
  const t0 = new Date("2030-01-01T09:00:00Z");

  it("gives two free months, then charges ₪300", async () => {
    const sub = await owner(t0);
    expect(sub.status).toBe("TRIALING");
    expect(sub.currentPeriodEnd).toEqual(addMonths(t0, 2));

    expect(await billing.runBillingCycle(addMonths(t0, 1))).toMatchObject({ charged: 0 });
    await billing.runBillingCycle(addMonths(t0, 2));
    const payments = await db.payment.findMany({ where: { subscriptionId: sub.id } });
    expect(payments.map((p) => p.amountAgorot)).toEqual([30000]);
    const after = await db.subscription.findUniqueOrThrow({ where: { id: sub.id } });
    expect(after.status).toBe("ACTIVE");
    expect(after.currentPeriodEnd).toEqual(addMonths(t0, 3));
  });

  it("credits the referrer only once a referral starts paying, and removes it when she cancels", async () => {
    const referrer = await owner(t0);
    const friends = [
      await owner(addDays(t0, 1), referrer.referralCode),
      await owner(addDays(t0, 2), referrer.referralCode),
      await owner(addDays(t0, 3), referrer.referralCode),
    ];
    // Everyone is still in the trial: no credit yet.
    expect((await billing.currentPrice(referrer.id)).totalAgorot).toBe(30000);

    // Each friend's trial ends and she pays her first month.
    for (const f of friends) await billing.chargeSubscription(f.id, f.currentPeriodEnd!);
    expect((await billing.currentPrice(referrer.id)).totalAgorot).toBe(0);

    // Three paying friends: the referrer's renewal is free.
    await db.subscription.update({ where: { id: referrer.id }, data: { currentPeriodEnd: addMonths(t0, 3) } });
    const free = await billing.chargeSubscription(referrer.id, addMonths(t0, 3));
    expect(free.payment).toMatchObject({ status: "SUCCEEDED", amountAgorot: 0, discountAgorot: 30000, referralCount: 3 });

    // One friend cancels after paying: the referrer is back to ₪100.
    const friendUser = await db.subscription.findUniqueOrThrow({ where: { id: friends[0].id } });
    await billing.cancelSubscription(friendUser.userId, addMonths(t0, 3));
    const next = await billing.chargeSubscription(referrer.id, addMonths(t0, 4));
    expect(next.payment).toMatchObject({ amountAgorot: 10000, referralCount: 2 });
  });

  it("does not count a referral whose payment failed", async () => {
    const referrer = await owner(t0);
    const friend = await owner(t0, referrer.referralCode, "test_decline");
    const { payment } = await billing.chargeSubscription(friend.id, friend.currentPeriodEnd!);
    expect(payment.status).toBe("FAILED");
    expect((await billing.currentPrice(referrer.id)).referrals).toBe(0);
  });

  it("ignores unknown and self referral codes", async () => {
    const sub = await owner(t0, "NOPE1234");
    expect(sub.referredById).toBeNull();
  });

  it("does not charge twice when two billing runs overlap", async () => {
    const sub = await owner(t0);
    const due = addMonths(t0, 2);
    await Promise.all([billing.runBillingCycle(due), billing.runBillingCycle(due)]);
    expect(await db.payment.count({ where: { subscriptionId: sub.id } })).toBe(1);
    // A later run on the same day finds nothing left to charge.
    await billing.runBillingCycle(due);
    expect(await db.payment.count({ where: { subscriptionId: sub.id } })).toBe(1);
  });
});
