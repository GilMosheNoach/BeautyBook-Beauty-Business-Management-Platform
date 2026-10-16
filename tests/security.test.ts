import { afterEach, describe, expect, it, vi } from "vitest";
import { ipFromHeaders, isRateLimited, rateLimit } from "@/lib/rateLimit";
import { isTestBilling, paymentProvider } from "@/server/payments";
import { slugError } from "@/lib/slug";

const h = (entries: Record<string, string>) => new Headers(entries);

describe("ipFromHeaders", () => {
  it("never trusts the client-written left end of X-Forwarded-For", () => {
    expect(ipFromHeaders(h({ "x-forwarded-for": "1.1.1.1, 9.9.9.9" }))).toBe("9.9.9.9");
  });
  it("prefers X-Real-IP", () => {
    expect(ipFromHeaders(h({ "x-real-ip": "5.5.5.5", "x-forwarded-for": "1.1.1.1" }))).toBe("5.5.5.5");
  });
  it("falls back when no header is present", () => {
    expect(ipFromHeaders(h({}))).toBe("local");
  });
});

describe("rateLimit", () => {
  it("blocks after the limit", () => {
    const key = `t:${Math.random()}`;
    expect([1, 2, 3].map(() => rateLimit(key, 2, 60_000))).toEqual([true, true, false]);
    expect(isRateLimited(key, 2)).toBe(true);
  });
});

describe("billing provider", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("does not fall back to free test billing in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BILLING_PROVIDER", "");
    expect(isTestBilling()).toBe(false);
    expect(() => paymentProvider()).toThrow("BILLING_PROVIDER is not set");
  });
  it("uses test billing in production only when asked explicitly", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BILLING_PROVIDER", "test");
    expect(isTestBilling()).toBe(true);
  });
  it("defaults to test billing in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("BILLING_PROVIDER", "");
    expect(isTestBilling()).toBe(true);
  });
});

describe("reserved slugs", () => {
  it("keeps platform page names free", () => {
    expect(slugError("privacy")).not.toBeNull();
    expect(slugError("terms")).not.toBeNull();
  });
});
