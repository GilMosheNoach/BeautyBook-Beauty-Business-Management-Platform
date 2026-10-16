import { localMinutesToDate, weekdayOf } from "./time";

export type Interval = { start: Date; end: Date };

export type SlotInput = {
  dateKey: string; // YYYY-MM-DD in the business timezone
  tz: string;
  durationMin: number;
  stepMin: number;
  bufferMin: number;
  minNoticeMin: number;
  now: Date;
  hours: { weekday: number; startMin: number; endMin: number }[];
  busy: Interval[]; // active appointments + time off
};

function overlaps(a: Interval, b: Interval) {
  return a.start < b.end && b.start < a.end;
}

/**
 * Start times (UTC instants) a service of `durationMin` can be booked at on
 * `dateKey`. A slot must fit inside one working range, start after the minimum
 * notice, and not overlap any busy interval (padded by the buffer).
 */
export function computeSlots(input: SlotInput): Date[] {
  const weekday = weekdayOf(input.dateKey);
  const earliest = new Date(input.now.getTime() + input.minNoticeMin * 60_000);
  const ranges = input.hours
    .filter((h) => h.weekday === weekday && h.endMin > h.startMin)
    .sort((a, b) => a.startMin - b.startMin);
  const bufferMs = input.bufferMin * 60_000;
  const busy = input.busy.map((b) => ({
    start: new Date(b.start.getTime() - bufferMs),
    end: new Date(b.end.getTime() + bufferMs),
  }));

  const result: Date[] = [];
  const seen = new Set<number>();
  for (const range of ranges) {
    for (let m = range.startMin; m + input.durationMin <= range.endMin; m += input.stepMin) {
      const start = localMinutesToDate(input.dateKey, m, input.tz);
      const end = localMinutesToDate(input.dateKey, m + input.durationMin, input.tz);
      if (start < earliest) continue;
      if (busy.some((b) => overlaps({ start, end }, b))) continue;
      if (seen.has(start.getTime())) continue;
      seen.add(start.getTime());
      result.push(start);
    }
  }
  return result;
}

/**
 * The free slots that sit right next to an existing appointment (just before
 * or just after it), so booking one keeps the owner's day without big gaps.
 * A slot counts as adjacent when the gap to the appointment, beyond the
 * buffer, is shorter than one slot step. No appointments means no marks.
 */
export function recommendedSlots(input: {
  slots: Date[];
  appointments: Interval[];
  durationMin: number;
  stepMin: number;
  bufferMin: number;
}): Date[] {
  const step = input.stepMin * 60_000;
  const buffer = input.bufferMin * 60_000;
  const duration = input.durationMin * 60_000;
  return input.slots.filter((slot) => {
    const start = slot.getTime();
    const end = start + duration;
    return input.appointments.some((a) => {
      const after = start - (a.end.getTime() + buffer);
      const before = a.start.getTime() - buffer - end;
      return (after >= 0 && after < step) || (before >= 0 && before < step);
    });
  });
}
