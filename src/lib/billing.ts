import { addDays, addMonths } from "date-fns";
import type { Subscription, SubscriptionStatus } from "@prisma/client";

export const PLAN_PRICE_AGOROT = 30_000;
export const REFERRAL_CREDIT_AGOROT = 10_000;
export const TRIAL_MONTHS = 2;
export const PAST_DUE_GRACE_DAYS = 7;

/** Monthly price after referral credits: ₪100 off per paying referral, never below zero. */
export function priceFor(payingReferrals: number) {
  const discountAgorot = Math.min(PLAN_PRICE_AGOROT, Math.max(0, payingReferrals) * REFERRAL_CREDIT_AGOROT);
  return { baseAgorot: PLAN_PRICE_AGOROT, discountAgorot, totalAgorot: PLAN_PRICE_AGOROT - discountAgorot };
}

export function trialEndFrom(start: Date) {
  return addMonths(start, TRIAL_MONTHS);
}

type AccessFields = Pick<Subscription, "status" | "currentPeriodEnd">;

/** Whether the owner may use the dashboard right now. */
export function hasAccess(sub: AccessFields | null | undefined, now = new Date()) {
  if (!sub) return false;
  switch (sub.status) {
    case "ACTIVE":
      return true;
    // A trial runs until its end date (plus grace, in case the billing run is late); a card is not needed until then.
    case "TRIALING":
    case "PAST_DUE":
      return !!sub.currentPeriodEnd && addDays(sub.currentPeriodEnd, PAST_DUE_GRACE_DAYS) > now;
    case "CANCELED":
      return !!sub.currentPeriodEnd && sub.currentPeriodEnd > now;
    default:
      return false;
  }
}

export const SUBSCRIPTION_LABEL: Record<SubscriptionStatus, string> = {
  INCOMPLETE: "ממתין לאמצעי תשלום",
  TRIALING: "תקופת ניסיון",
  ACTIVE: "פעיל",
  PAST_DUE: "החיוב נכשל",
  CANCELED: "בוטל",
};
