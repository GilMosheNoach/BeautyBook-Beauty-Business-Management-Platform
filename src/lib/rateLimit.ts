import { headers } from "next/headers";

// Fixed-window, in-memory limiter. Good enough for a single instance; swap for
// a shared store (Redis/Upstash) when running several instances.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    }
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

/** True once `key` has used up `limit` within its current window, without counting this check. */
export function isRateLimited(key: string, limit: number) {
  const bucket = buckets.get(key);
  return !!bucket && bucket.resetAt > Date.now() && bucket.count >= limit;
}

/**
 * The caller's IP for rate limiting. The left end of X-Forwarded-For is whatever the
 * client sent, so it is never used: X-Real-IP (set by the hosting proxy) wins, then the
 * right-most X-Forwarded-For entry, the one our own proxy appended.
 */
export function ipFromHeaders(h: Pick<Headers, "get">) {
  const real = h.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = h.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean);
  return forwarded?.at(-1) || "local";
}

export async function clientIp() {
  return ipFromHeaders(await headers());
}
