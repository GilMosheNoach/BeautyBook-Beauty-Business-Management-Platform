"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireBusiness } from "@/lib/session";
import { addDaysToKey, hhmmToMinutes, isDateKey, localMinutesToDate } from "@/lib/time";
import type { FormState } from "@/components/FormMessage";

const rangesSchema = z.array(
  z.object({
    weekday: z.number().int().min(0).max(6),
    startMin: z.number().int().min(0).max(1440),
    endMin: z.number().int().min(0).max(1440),
  }),
);

export async function saveHoursAction(_: FormState, form: FormData): Promise<FormState> {
  const business = await requireBusiness();
  let ranges;
  try {
    ranges = rangesSchema.parse(JSON.parse(String(form.get("hours") ?? "[]")));
  } catch {
    return { error: "נתונים לא תקינים" };
  }
  for (const r of ranges) {
    if (r.endMin <= r.startMin) return { error: "שעת הסיום חייבת להיות אחרי שעת ההתחלה" };
  }
  for (let wd = 0; wd < 7; wd++) {
    const day = ranges.filter((r) => r.weekday === wd).sort((a, b) => a.startMin - b.startMin);
    for (let i = 1; i < day.length; i++) {
      if (day[i].startMin < day[i - 1].endMin) return { error: "יש טווחי שעות חופפים באותו יום" };
    }
  }
  await db.$transaction([
    db.workingHours.deleteMany({ where: { businessId: business.id } }),
    db.workingHours.createMany({ data: ranges.map((r) => ({ ...r, businessId: business.id })) }),
  ]);
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/b/${business.slug}`);
  return { ok: "שעות העבודה נשמרו" };
}

const timeOffSchema = z.object({
  fromDate: z.string().refine(isDateKey, "תאריך לא תקין"),
  toDate: z.string().refine(isDateKey, "תאריך לא תקין"),
  fromTime: z.string().optional().default(""),
  toTime: z.string().optional().default(""),
  allDay: z.string().optional(),
  reason: z.string().trim().max(100).optional().default(""),
});

export async function addTimeOffAction(_: FormState, form: FormData): Promise<FormState> {
  const business = await requireBusiness();
  const parsed = timeOffSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const tz = business.timezone;
  const allDay = d.allDay === "on" || !d.fromTime || !d.toTime;
  const startsAt = localMinutesToDate(d.fromDate, allDay ? 0 : hhmmToMinutes(d.fromTime), tz);
  const endsAt = allDay
    ? localMinutesToDate(addDaysToKey(d.toDate, 1), 0, tz)
    : localMinutesToDate(d.toDate, hhmmToMinutes(d.toTime), tz);
  if (endsAt <= startsAt) return { error: "הסיום חייב להיות אחרי ההתחלה" };
  await db.timeOff.create({ data: { businessId: business.id, startsAt, endsAt, reason: d.reason } });
  revalidatePath("/dashboard", "layout");
  return { ok: "החסימה נוספה" };
}

export async function deleteTimeOffAction(form: FormData) {
  const business = await requireBusiness();
  await db.timeOff.deleteMany({ where: { id: String(form.get("id") ?? ""), businessId: business.id } });
  revalidatePath("/dashboard", "layout");
}
