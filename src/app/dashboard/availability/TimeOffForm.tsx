"use client";

import { useActionState, useState } from "react";
import { addTimeOffAction } from "@/server/actions/availability";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";

export function TimeOffForm({ today }: { today: string }) {
  const [state, action] = useActionState(addTimeOffAction, undefined);
  const [allDay, setAllDay] = useState(true);
  return (
    <form action={action} className="space-y-3">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="allDay" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="accent-brand-600" />
        ימים שלמים
      </label>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">מתאריך</label>
          <input className="input" type="date" name="fromDate" defaultValue={today} required />
        </div>
        <div>
          <label className="label">עד תאריך</label>
          <input className="input" type="date" name="toDate" defaultValue={today} required />
        </div>
        {!allDay && (
          <>
            <div>
              <label className="label">משעה</label>
              <input className="input" type="time" name="fromTime" defaultValue="12:00" required />
            </div>
            <div>
              <label className="label">עד שעה</label>
              <input className="input" type="time" name="toTime" defaultValue="14:00" required />
            </div>
          </>
        )}
      </div>
      <div>
        <label className="label">סיבה (לא חובה)</label>
        <input className="input" name="reason" placeholder="חופשה, השתלמות…" />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-secondary w-full">הוספת חסימה</SubmitButton>
    </form>
  );
}
