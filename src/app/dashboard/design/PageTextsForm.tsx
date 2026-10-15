"use client";

import { useActionState } from "react";
import { updatePageTextsAction } from "@/server/actions/images";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";

export function PageTextsForm({ tagline, about }: { tagline: string; about: string }) {
  const [state, action] = useActionState(updatePageTextsAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="tagline">שורת פתיחה</label>
        <input className="input" id="tagline" name="tagline" maxLength={120} defaultValue={tagline} placeholder="לדוגמה: טיפולי פנים וגבות בסטודיו פרטי ושקט" />
        <p className="muted mt-1">מופיעה מתחת לשם העסק, על התמונה הראשית.</p>
      </div>
      <div>
        <label className="label" htmlFor="about">כמה מילים על העסק</label>
        <textarea className="input" id="about" name="about" rows={4} maxLength={1000} defaultValue={about} placeholder="מי את, מה הגישה שלך ומה מחכה ללקוחה אצלך" />
      </div>
      <FormMessage state={state} />
      <SubmitButton>שמירה</SubmitButton>
    </form>
  );
}
