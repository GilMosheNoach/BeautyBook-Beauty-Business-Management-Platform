"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/billing";
import { requireUser } from "@/lib/session";
import { cancelSubscription, chargeSubscription, completeCheckout, getSubscription, resumeSubscription, startCheckout } from "@/server/billing";
import { isTestBilling } from "@/server/payments";

export async function startCheckoutAction() {
  const user = await requireUser();
  const sub = await getSubscription(user.id);
  redirect(await startCheckout(sub, user));
}

/** Return from the simulated gateway page. Only exists in test billing mode. */
export async function completeTestCheckoutAction(token: string, form: FormData) {
  if (!isTestBilling()) throw new Error("Test checkout is disabled");
  const user = await requireUser();
  const pending = await db.subscription.findUnique({ where: { checkoutToken: token } });
  if (!pending || pending.userId !== user.id) redirect("/subscribe");

  const declined = form.get("outcome") === "decline";
  const sub = await completeCheckout(token, { customerRef: `${declined ? "test_decline" : "test_ok"}_${token}`, last4: declined ? "0002" : "4242" });
  if (!sub || !hasAccess(sub)) redirect("/subscribe?failed=1");
  redirect(user.business ? "/dashboard/billing" : "/onboarding");
}

export async function cancelSubscriptionAction() {
  const user = await requireUser();
  await cancelSubscription(user.id);
  revalidatePath("/dashboard/billing");
}

export async function resumeSubscriptionAction() {
  const user = await requireUser();
  await resumeSubscription(user.id);
  revalidatePath("/dashboard/billing");
}

/** Test mode only: pretends the current trial or month just ended and charges now. */
export async function simulateRenewalAction() {
  if (!isTestBilling()) throw new Error("Simulation is disabled");
  const user = await requireUser();
  const sub = await getSubscription(user.id);
  if (sub.status === "TRIALING" || sub.status === "ACTIVE") {
    await db.subscription.update({ where: { id: sub.id }, data: { currentPeriodEnd: new Date() } });
  }
  if (sub.status === "TRIALING" || sub.status === "ACTIVE" || sub.status === "PAST_DUE") {
    await chargeSubscription(sub.id);
  }
  revalidatePath("/dashboard/billing");
}
