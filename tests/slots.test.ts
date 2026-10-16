import { describe, expect, it } from "vitest";
import { computeSlots, recommendedSlots } from "@/lib/slots";
import { localMinutesToDate } from "@/lib/time";

const TZ = "Asia/Jerusalem";
const base = {
  tz: TZ,
  stepMin: 30,
  bufferMin: 0,
  minNoticeMin: 0,
  now: new Date("2026-01-01T00:00:00Z"),
  busy: [],
};
const at = (date: string, hhmm: string) => localMinutesToDate(date, Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3)), TZ);
const times = (slots: Date[]) => slots.map((s) => s.toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }));

// 2026-03-01 is a Sunday (weekday 0).
const SUNDAY = "2026-03-01";

describe("computeSlots", () => {
  it("offers slots that fit inside the working range", () => {
    const slots = computeSlots({ ...base, dateKey: SUNDAY, durationMin: 60, hours: [{ weekday: 0, startMin: 9 * 60, endMin: 11 * 60 }] });
    expect(times(slots)).toEqual(["09:00", "09:30", "10:00"]);
  });

  it("returns nothing on a day without hours", () => {
    const slots = computeSlots({ ...base, dateKey: "2026-03-07", durationMin: 30, hours: [{ weekday: 0, startMin: 540, endMin: 600 }] });
    expect(slots).toEqual([]);
  });

  it("supports split days (lunch break)", () => {
    const slots = computeSlots({
      ...base,
      dateKey: SUNDAY,
      durationMin: 60,
      hours: [
        { weekday: 0, startMin: 9 * 60, endMin: 10 * 60 },
        { weekday: 0, startMin: 13 * 60, endMin: 14 * 60 },
      ],
    });
    expect(times(slots)).toEqual(["09:00", "13:00"]);
  });

  it("skips slots overlapping busy intervals, padded by the buffer", () => {
    const hours = [{ weekday: 0, startMin: 9 * 60, endMin: 13 * 60 }];
    const busy = [{ start: at(SUNDAY, "10:00"), end: at(SUNDAY, "11:00") }];
    expect(times(computeSlots({ ...base, dateKey: SUNDAY, durationMin: 60, hours, busy }))).toEqual(["09:00", "11:00", "11:30", "12:00"]);
    expect(times(computeSlots({ ...base, dateKey: SUNDAY, durationMin: 60, hours, busy, bufferMin: 15 }))).toEqual(["11:30", "12:00"]);
  });

  it("respects minimum notice", () => {
    const slots = computeSlots({
      ...base,
      dateKey: SUNDAY,
      durationMin: 30,
      hours: [{ weekday: 0, startMin: 9 * 60, endMin: 12 * 60 }],
      now: at(SUNDAY, "08:50"),
      minNoticeMin: 120,
    });
    expect(times(slots)[0]).toBe("11:00");
  });

  it("uses local wall-clock time across daylight saving changes", () => {
    // Israel moves to summer time on Friday 2026-03-27; Sunday 2026-03-29 is +03:00.
    const slots = computeSlots({ ...base, dateKey: "2026-03-29", durationMin: 60, hours: [{ weekday: 0, startMin: 9 * 60, endMin: 10 * 60 }] });
    expect(slots.map((s) => s.toISOString())).toEqual(["2026-03-29T06:00:00.000Z"]);
  });
});

describe("recommendedSlots", () => {
  const hours = [{ weekday: 0, startMin: 7 * 60, endMin: 19 * 60 }];
  const day = (busy: { start: Date; end: Date }[], bufferMin = 0) =>
    computeSlots({ ...base, bufferMin, dateKey: SUNDAY, durationMin: 60, hours, busy });

  it("marks nothing on a day without appointments", () => {
    expect(recommendedSlots({ slots: day([]), appointments: [], durationMin: 60, stepMin: 30, bufferMin: 0 })).toEqual([]);
  });

  it("marks the slots right before and right after an appointment", () => {
    const appt = { start: at(SUNDAY, "12:00"), end: at(SUNDAY, "13:00") };
    const rec = recommendedSlots({ slots: day([appt]), appointments: [appt], durationMin: 60, stepMin: 30, bufferMin: 0 });
    expect(times(rec)).toEqual(["11:00", "13:00"]);
  });

  it("accounts for the buffer and off-grid appointment ends", () => {
    const appt = { start: at(SUNDAY, "12:00"), end: at(SUNDAY, "12:45") };
    const rec = recommendedSlots({ slots: day([appt], 10), appointments: [appt], durationMin: 60, stepMin: 30, bufferMin: 10 });
    expect(times(rec)).toEqual(["10:30", "13:00"]);
  });
});
