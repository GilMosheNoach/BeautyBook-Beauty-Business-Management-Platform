import { randomInt } from "node:crypto";
import { addDays, addMinutes, addMonths } from "date-fns";
import { Prisma, type Subscription } from "@prisma/client";
import { db } from "@/lib/db";
import { PAST_DUE_GRACE_DAYS, hasAccess, priceFor, trialEndFrom } from "@/lib/billing";
import { paymentProvider } from "./payments";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function newReferralCode() {
  let code = "";
  for (let i = 0; i < 8; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return code;
}

export function normalizeReferralCode(code: string | null | undefined) {
  return (code ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
}

function isUniqueViolation(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

/** The referrer behind a referral code, for showing "invited by" on signup. */
export async function findReferrer(code: string | null | undefined) {
  const normalized = normalizeReferralCode(code);
  if (!normalized) return null;
  return db.subscription.findUnique({
    where: { referralCode: normalized },
    select: { id: true, userId: true, user: { select: { name: true, business: { select: { name: true } } } } },
  });
}

export async function createSubscription(userId: string, referralCode?: string | null) {
  const referrer = await findReferrer(referralCode);
  const referredById = referrer && referrer.userId !== userId ? referrer.id : null;
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.subscription.create({ data: { userId, referralCode: newReferralCode(), referredById } });
    } catch (e) {
      if (!isUniqueViolation(e) || attempt >= 4) throw e;
      const existing = await db.subscription.findUnique({ where: { userId } });
      if (existing) return existing;
    }
  }
}

/** The owner's subscription, created on first use for accounts that predate billing. */
export async function getSubscription(userId: string) {
  return (await db.subscription.findUnique({ where: { userId } })) ?? createSubscription(userId);
}

/** Referred owners who have paid at least once and are still subscribed. */
export function payingReferralCount(subscriptionId: string) {
  return db.subscription.count({ where: { referredById: subscriptionId, status: "ACTIVE", firstPaidAt: { not: null } } });
}

export async function currentPrice(subscriptionId: string) {
  const referrals = await payingReferralCount(subscriptionId);
  return { referrals, ...priceFor(referrals) };
}

export async function startCheckout(sub: Subscription, user: { email: string; name: string }) {
  const provider = paymentProvider();
  const { token, url } = await provider.createCheckout({ subscriptionId: sub.id, email: user.email, name: user.name });
  await db.subscription.update({ where: { id: sub.id }, data: { checkoutToken: token, provider: provider.name } });
  return url;
}

/**
 * The gateway confirmed a saved card. A new sign-up starts its free trial; a
 * lapsed or failed subscription is charged right away with the new card.
 */
export async function completeCheckout(token: string, card: { customerRef: string; last4: string }, now = new Date()) {
  const sub = await db.subscription.findUnique({ where: { checkoutToken: token } });
  if (!sub) return null;
  const claimed = await db.subscription.updateMany({
    where: { id: sub.id, checkoutToken: token },
    data: { checkoutToken: null, customerRef: card.customerRef, cardLast4: card.last4 },
  });
  if (claimed.count === 0) return null;

  if (sub.status === "INCOMPLETE") {
    const ends = trialEndFrom(now);
    return db.subscription.update({ where: { id: sub.id }, data: { status: "TRIALING", trialEndsAt: ends, currentPeriodEnd: ends } });
  }
  if (sub.status === "PAST_DUE" || !hasAccess(sub, now)) return (await chargeSubscription(sub.id, now)).subscription;
  return db.subscription.findUniqueOrThrow({ where: { id: sub.id } });
}

/**
 * Charges one month. The price uses the referral count at this moment, so a
 * referral that started paying gives credit and one that cancelled stops giving it.
 */
export async function chargeSubscription(subscriptionId: string, now = new Date(), opts: { onlyIfDue?: boolean } = {}) {
  const clock = new Date();
  const locked = await db.subscription.updateMany({
    where: { id: subscriptionId, OR: [{ chargingAt: null }, { chargingAt: { lt: addMinutes(clock, -10) } }] },
    data: { chargingAt: clock },
  });
  if (locked.count === 0) throw new Error("CHARGE_IN_PROGRESS");

  try {
    const sub = await db.subscription.findUniqueOrThrow({ where: { id: subscriptionId } });
    // Another run may have renewed it since the due list was read.
    if (opts.onlyIfDue && (!sub.currentPeriodEnd || sub.currentPeriodEnd > now || sub.status === "CANCELED")) {
      throw new Error("NOT_DUE");
    }
    const price = await currentPrice(sub.id);
    // Renewals keep their billing day; a failed or lapsed subscription restarts today.
    const periodStart = (sub.status === "TRIALING" || sub.status === "ACTIVE") && sub.currentPeriodEnd ? sub.currentPeriodEnd : now;
    const periodEnd = addMonths(periodStart, 1);

    const result =
      price.totalAgorot === 0
        ? ({ ok: true, ref: "" } as const)
        : !sub.customerRef
          ? ({ ok: false, reason: "אין אמצעי תשלום שמור" } as const)
          : await paymentProvider().charge({ customerRef: sub.customerRef, amountAgorot: price.totalAgorot, description: "BeautyBook מנוי חודשי" });

    const payment = await db.payment.create({
      data: {
        subscriptionId: sub.id,
        status: result.ok ? "SUCCEEDED" : "FAILED",
        baseAgorot: price.baseAgorot,
        discountAgorot: price.discountAgorot,
        amountAgorot: price.totalAgorot,
        referralCount: price.referrals,
        periodStart,
        periodEnd,
        providerRef: result.ok ? result.ref : "",
        failureReason: result.ok ? "" : result.reason,
      },
    });
    const subscription = await db.subscription.update({
      where: { id: sub.id },
      data: result.ok
        ? { status: "ACTIVE", firstPaidAt: sub.firstPaidAt ?? now, currentPeriodEnd: periodEnd, canceledAt: null }
        : { status: "PAST_DUE" },
    });
    return { subscription, payment };
  } finally {
    await db.subscription.update({ where: { id: subscriptionId }, data: { chargingAt: null } });
  }
}

/** Charges every subscription whose trial or paid period has ended. Run daily. */
export async function runBillingCycle(now = new Date()) {
  const due = await db.subscription.findMany({
    where: {
      currentPeriodEnd: { lte: now },
      OR: [
        { status: { in: ["TRIALING", "ACTIVE"] } },
        // Retry failed charges daily while the grace period lasts.
        { status: "PAST_DUE", currentPeriodEnd: { gt: addDays(now, -PAST_DUE_GRACE_DAYS) } },
      ],
    },
    orderBy: { currentPeriodEnd: "asc" },
    select: { id: true },
  });
  const summary = { charged: 0, failed: 0, skipped: 0 };
  for (const { id } of due) {
    try {
      const { payment } = await chargeSubscription(id, now, { onlyIfDue: true });
      if (payment.status === "SUCCEEDED") summary.charged++;
      else summary.failed++;
    } catch {
      summary.skipped++;
    }
  }
  return summary;
}

/** Stops renewal. Access lasts until the end of the period, but referral credit ends now. */
export async function cancelSubscription(userId: string, now = new Date()) {
  const res = await db.subscription.updateMany({
    where: { userId, status: { in: ["TRIALING", "ACTIVE", "PAST_DUE"] } },
    data: { status: "CANCELED", canceledAt: now },
  });
  return res.count > 0;
}

/** Undoes a cancellation while the period it was paid for is still running. */
export async function resumeSubscription(userId: string, now = new Date()) {
  const sub = await db.subscription.findUnique({ where: { userId } });
  if (!sub || sub.status !== "CANCELED" || !sub.currentPeriodEnd || sub.currentPeriodEnd <= now) return false;
  await db.subscription.update({
    where: { id: sub.id },
    data: { status: sub.firstPaidAt ? "ACTIVE" : "TRIALING", canceledAt: null },
  });
  return true;
}
