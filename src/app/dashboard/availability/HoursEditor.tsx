"use client";

import { useActionState, useState } from "react";
import { saveHoursAction } from "@/server/actions/availability";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import { WEEKDAYS_HE, hhmmToMinutes, minutesToHHMM } from "@/lib/time";

type Range = { weekday: number; startMin: number; endMin: number };

export function HoursEditor({ initial }: { initial: Range[] }) {
  const [state, action] = useActionState(saveHoursAction, undefined);
  const [ranges, setRanges] = useState<Range[]>(initial);

  const update = (idx: number, patch: Partial<Range>) => setRanges((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const remove = (idx: number) => setRanges((rs) => rs.filter((_, i) => i !== idx));
  const add = (weekday: number) => {
    const day = ranges.filter((r) => r.weekday === weekday);
    const last = day.at(-1);
    const startMin = last ? Math.min(last.endMin + 60, 22 * 60) : 9 * 60;
    setRanges((rs) => [...rs, { weekday, startMin, endMin: Math.min(startMin + 4 * 60, 23 * 60 + 30) }]);
  };

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="hours" value={JSON.stringify(ranges)} />
      {WEEKDAYS_HE.map((label, weekday) => {
        const day = ranges.map((r, idx) => ({ r, idx })).filter(({ r }) => r.weekday === weekday);
        return (
          <div key={weekday} className="flex flex-wrap items-start gap-3 border-b border-stone-100 pb-3 last:border-0">
            <div className="w-16 pt-2 font-medium">{label}</div>
            <div className="flex-1 space-y-2">
              {day.length === 0 && <p className="pt-2 text-sm text-stone-400">סגור</p>}
              {day.map(({ r, idx }) => (
                <div key={idx} className="flex items-center gap-2">
                  <input type="time" step={900} className="input w-28" value={minutesToHHMM(r.startMin)} onChange={(e) => update(idx, { startMin: hhmmToMinutes(e.target.value) })} />
                  <span className="text-stone-400">–</span>
                  <input type="time" step={900} className="input w-28" value={minutesToHHMM(r.endMin)} onChange={(e) => update(idx, { endMin: hhmmToMinutes(e.target.value) })} />
                  <button type="button" className="btn-ghost btn-sm" onClick={() => remove(idx)} aria-label="הסרה">✕</button>
                </div>
              ))}
            </div>
            <button type="button" className="btn-ghost btn-sm" onClick={() => add(weekday)}>+ טווח</button>
          </div>
        );
      })}
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full sm:w-auto">שמירת שעות</SubmitButton>
    </form>
  );
}
