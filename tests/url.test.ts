import { afterEach, describe, expect, it, vi } from "vitest";
import { businessUrl, slugFromHost } from "@/lib/url";

afterEach(() => vi.unstubAllEnvs());

describe("slugFromHost", () => {
  it("reads the business from its subdomain", () => {
    expect(slugFromHost("michal.beautybook.co.il", "beautybook.co.il")).toBe("michal");
    expect(slugFromHost("Michal-Beauty.BeautyBook.co.il:443", "beautybook.co.il")).toBe("michal-beauty");
  });

  it("ignores the main domain, www, deeper subdomains and other hosts", () => {
    expect(slugFromHost("beautybook.co.il", "beautybook.co.il")).toBeNull();
    expect(slugFromHost("www.beautybook.co.il", "beautybook.co.il")).toBeNull();
    expect(slugFromHost("a.b.beautybook.co.il", "beautybook.co.il")).toBeNull();
    expect(slugFromHost("michal.evil.com", "beautybook.co.il")).toBeNull();
    expect(slugFromHost("xbeautybook.co.il", "beautybook.co.il")).toBeNull();
    expect(slugFromHost(null, "beautybook.co.il")).toBeNull();
  });

  it("falls back to <slug>.localhost when no root domain is set", () => {
    expect(slugFromHost("demo.localhost:3006", "")).toBe("demo");
    expect(slugFromHost("localhost:3006", "")).toBeNull();
  });
});

describe("businessUrl", () => {
  it("uses /b/<slug> without a root domain", () => {
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3006");
    expect(businessUrl("demo")).toBe("http://localhost:3006/b/demo");
    expect(businessUrl("demo", "/a/tok")).toBe("http://localhost:3006/b/demo/a/tok");
  });

  it("uses the subdomain once a root domain is set", () => {
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "beautybook.co.il");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://beautybook.co.il");
    expect(businessUrl("demo")).toBe("https://demo.beautybook.co.il");
    expect(businessUrl("demo", "?invite=x")).toBe("https://demo.beautybook.co.il?invite=x");
  });
});
