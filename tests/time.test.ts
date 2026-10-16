import { describe, expect, it } from "vitest";
import { computeSlots } from "@/lib/slots";
import { isDateKey, isHHMM, localMinutesToDate } from "@/lib/time";
import { isRateLimited, rateLimit } from "@/lib/rateLimit";

const TZ = "Asia/Jerusalem";

describe("localMinutesToDate", () => {
  it("treats 24:00 as midnight at the end of the day, not its start", () => {
    expect(localMinutesToDate("2026-03-01", 1440, TZ).toISOString()).toBe("2026-03-01T22:00:00.000Z");
  });

  it("rolls minutes past midnight into the next day", () => {
    expect(localMinutesToDate("2026-03-01", 1440 + 90, TZ).toISOString()).toBe("2026-03-01T23:30:00.000Z");
  });

  it("follows Israeli summer and winter time", () => {
    // Winter (UTC+2) and summer (UTC+3) on either side of the October 2026 change.
    expect(localMinutesToDate("2026-10-26", 600, TZ).toISOString()).toBe("2026-10-26T08:00:00.000Z");
    expect(localMinutesToDate("2026-10-23", 600, TZ).toISOString()).toBe("2026-10-23T07:00:00.000Z");
  });
});

describe("input checks", () => {
  it("accepts only real calendar dates", () => {
    expect(isDateKey("2028-02-29")).toBe(true);
    expect(isDateKey("2026-02-29")).toBe(false);
    expect(isDateKey("2026-13-01")).toBe(false);
    expect(isDateKey("2026-1-1")).toBe(false);
    expect(isDateKey(undefined)).toBe(false);
  });

  it("accepts only 24-hour clock times", () => {
    expect(isHHMM("00:00")).toBe(true);
    expect(isHHMM("23:59")).toBe(true);
    expect(isHHMM("24:00")).toBe(false);
    expect(isHHMM("25:99")).toBe(false);
    expect(isHHMM("9:00")).toBe(false);
  });
});

describe("slots near midnight", () => {
  it("does not offer a late slot that overlaps a booking when hours run until midnight", () => {
    const busy = [{ start: localMinutesToDate("2026-03-01", 23 * 60, TZ), end: localMinutesToDate("2026-03-01", 1440, TZ) }];
    const slots = computeSlots({
      dateKey: "2026-03-01",
      tz: TZ,
      durationMin: 60,
      stepMin: 60,
      bufferMin: 0,
      minNoticeMin: 0,
      now: new Date("2026-01-01T00:00:00Z"),
      hours: [{ weekday: 0, startMin: 21 * 60, endMin: 1440 }],
      busy,
    });
    expect(slots.map((s) => s.toISOString())).toEqual(["2026-03-01T19:00:00.000Z", "2026-03-01T20:00:00.000Z"]);
  });

  it("offers the same wall-clock times on the day summer time ends", () => {
    const slots = computeSlots({
      dateKey: "2026-10-25",
      tz: TZ,
      durationMin: 60,
      stepMin: 60,
      bufferMin: 0,
      minNoticeMin: 0,
      now: new Date("2026-01-01T00:00:00Z"),
      hours: [{ weekday: 0, startMin: 9 * 60, endMin: 12 * 60 }],
      busy: [],
    });
    expect(slots.map((s) => s.toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }))).toEqual(["09:00", "10:00", "11:00"]);
  });
});

describe("rate limit", () => {
  it("reports a key as limited only after it used its allowance", () => {
    const key = `test:${Math.random()}`;
    expect(isRateLimited(key, 2)).toBe(false);
    rateLimit(key, 2, 60_000);
    expect(isRateLimited(key, 2)).toBe(false);
    rateLimit(key, 2, 60_000);
    expect(isRateLimited(key, 2)).toBe(true);
  });
});
