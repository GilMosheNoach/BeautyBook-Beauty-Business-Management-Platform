import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { he } from "date-fns/locale";

export const DEFAULT_TZ = "Asia/Jerusalem";

/** "YYYY-MM-DD" of the given instant, in the business's timezone. */
export function localDateKey(date: Date, tz: string) {
  return formatInTimeZone(date, tz, "yyyy-MM-dd");
}

/**
 * UTC instant of local wall-clock time `minutes` after midnight of `dateKey`.
 * 1440 (a range that ends at midnight) and beyond roll over to the next day.
 */
export function localMinutesToDate(dateKey: string, minutes: number, tz: string) {
  const days = Math.floor(minutes / 1440);
  const rest = minutes - days * 1440;
  const key = days ? addDaysToKey(dateKey, days) : dateKey;
  const h = String(Math.floor(rest / 60)).padStart(2, "0");
  const m = String(rest % 60).padStart(2, "0");
  return fromZonedTime(`${key}T${h}:${m}:00`, tz);
}

/** Weekday (0 = Sunday) of a "YYYY-MM-DD" key. */
export function weekdayOf(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function addDaysToKey(dateKey: string, days: number) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

/** A real calendar date in "YYYY-MM-DD" form (rejects 2026-02-30). */
export function isDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** "HH:mm" on a 24-hour clock, 00:00–23:59. */
export function isHHMM(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function fmt(date: Date, tz: string, pattern: string) {
  return formatInTimeZone(date, tz, pattern, { locale: he });
}

export function fmtTime(date: Date, tz: string) {
  return formatInTimeZone(date, tz, "HH:mm");
}

export function minutesToHHMM(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

export function hhmmToMinutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + (m || 0);
}

export const WEEKDAYS_HE = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
