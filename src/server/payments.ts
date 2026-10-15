import { newToken } from "@/lib/tokens";
import { appUrl } from "@/lib/url";

/**
 * A card gateway with a hosted payment page. The app never sees card numbers:
 * the gateway stores the card and gives back a token (customerRef) to charge later.
 */
export interface PaymentProvider {
  name: string;
  /** Starts a hosted page where the owner saves a card. `token` identifies it on return. */
  createCheckout(input: { subscriptionId: string; email: string; name: string }): Promise<{ token: string; url: string }>;
  charge(input: { customerRef: string; amountAgorot: number; description: string }): Promise<{ ok: true; ref: string } | { ok: false; reason: string }>;
}

/** Simulated gateway for local development: no money moves, no card details are collected. */
const testProvider: PaymentProvider = {
  name: "test",
  async createCheckout() {
    const token = newToken();
    return { token, url: appUrl(`/subscribe/test-checkout/${token}`) };
  },
  async charge({ customerRef }) {
    if (customerRef.startsWith("test_decline")) return { ok: false, reason: "הכרטיס נדחה (כרטיס בדיקה)" };
    return { ok: true, ref: `test_${newToken(8)}` };
  },
};

export function paymentProvider(): PaymentProvider {
  const name = process.env.BILLING_PROVIDER || "test";
  if (name === "test") return testProvider;
  throw new Error(`Unknown BILLING_PROVIDER "${name}"`);
}

export function isTestBilling() {
  return paymentProvider().name === "test";
}
