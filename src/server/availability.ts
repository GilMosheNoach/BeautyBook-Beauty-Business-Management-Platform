import type { Business } from "@prisma/client";
import { db } from "@/lib/db";
import { computeSlots, recommendedSlots, type Interval } from "@/lib/slots";
import { addDaysToKey, localDateKey, localMinutesToDate } from "@/lib/time";

export const ACTIVE_STATUSES = ["PENDING", "CONFIRMED"] as const;

/** Appointments and time off that block any part of [rangeStart, rangeEnd). */
export async function busyIntervals(businessId: string, rangeStart: Date, rangeEnd: Date): Promise<Interval[]> {
  const { appointments, timeOff } = await busyParts(businessId, rangeStart, rangeEnd);
  return [...appointments, ...timeOff];
}

async function busyParts(businessId: string, rangeStart: Date, rangeEnd: Date): Promise<{ appointments: Interval[]; timeOff: Interval[] }> {
  const dayStart = rangeStart;
  const dayEnd = rangeEnd;
  const [appointments, timeOff] = await Promise.all([
    db.appointment.findMany({
      where: {
        businessId,
        status: { in: [...ACTIVE_STATUSES] },
        startsAt: { lt: dayEnd },
        endsAt: { gt: dayStart },
      },
      select: { startsAt: true, endsAt: true },
    }),
    db.timeOff.findMany({
      where: { businessId, startsAt: { lt: dayEnd }, endsAt: { gt: dayStart } },
      select: { startsAt: true, endsAt: true },
    }),
  ]);
  const toInterval = (b: { startsAt: Date; endsAt: Date }) => ({ start: b.startsAt, end: b.endsAt });
  return { appointments: appointments.map(toInterval), timeOff: timeOff.map(toInterval) };
}

export function bookableWindow(business: Business, now = new Date()) {
  const first = localDateKey(now, business.timezone);
  const last = addDaysToKey(first, business.maxAdvanceDays);
  return { first, last };
}

/**
 * Bookable start times for `days` consecutive local days from `fromKey`,
 * clipped to the business's booking window. One query for the whole range.
 */
export async function availableDays(business: Business, durationMin: number, fromKey: string, days: number, now = new Date()) {
  const { first, last } = bookableWindow(business, now);
  const start = fromKey < first ? first : fromKey;
  const keys: string[] = [];
  for (let k = start; k <= last && keys.length < days; k = addDaysToKey(k, 1)) keys.push(k);
  if (!keys.length) return [];

  const tz = business.timezone;
  const [hours, { appointments, timeOff }] = await Promise.all([
    db.workingHours.findMany({ where: { businessId: business.id } }),
    busyParts(business.id, localMinutesToDate(keys[0], 0, tz), localMinutesToDate(addDaysToKey(keys.at(-1)!, 1), 0, tz)),
  ]);
  const busy = [...appointments, ...timeOff];
  return keys.map((dateKey) => {
    const slots = computeSlots({
      dateKey,
      tz,
      durationMin,
      stepMin: business.slotStepMin,
      bufferMin: business.bufferMin,
      minNoticeMin: business.minNoticeMin,
      now,
      hours,
      busy,
    });
    return {
      date: dateKey,
      slots,
      recommended: recommendedSlots({ slots, appointments, durationMin, stepMin: business.slotStepMin, bufferMin: business.bufferMin }),
    };
  });
}

export async function availableSlots(business: Business, durationMin: number, dateKey: string, now = new Date()) {
  const [day] = await availableDays(business, durationMin, dateKey, 1, now);
  return day && day.date === dateKey ? day.slots : [];
}

/** Weekdays (0–6) on which the business has any working hours. */
export async function workingWeekdays(businessId: string) {
  const rows = await db.workingHours.findMany({ where: { businessId }, select: { weekday: true }, distinct: ["weekday"] });
  return rows.map((r) => r.weekday);
}
