import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { he } from "date-fns/locale";

export const DEFAULT_TZ = "Asia/Jerusalem";

/** "YYYY-MM-DD" of the given instant, in the business's timezone. */
export function localDateKey(date: Date, tz: string) {
  return formatInTimeZone(date, tz, "yyyy-MM-dd");
}

/** UTC instant of local wall-clock time `minutes` after midnight of `dateKey`. */
export function localMinutesToDate(dateKey: string, minutes: number, tz: string) {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return fromZonedTime(`${dateKey}T${h}:${m}:00`, tz);
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

export function isDateKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
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
