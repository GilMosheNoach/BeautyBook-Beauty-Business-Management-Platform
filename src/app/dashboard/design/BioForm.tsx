"use client";

import { useActionState } from "react";
import { updateBioAction } from "@/server/actions/images";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";

export function BioForm({ bioTitle, bio }: { bioTitle: string; bio: string }) {
  const [state, action] = useActionState(updateBioAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="bioTitle">כותרת</label>
        <input className="input" id="bioTitle" name="bioTitle" maxLength={80} defaultValue={bioTitle} placeholder="לדוגמה: נעים להכיר, אני מיכל" />
      </div>
      <div>
        <label className="label" htmlFor="bio">קצת עלייך</label>
        <textarea className="input" id="bio" name="bio" rows={6} maxLength={2000} defaultValue={bio} placeholder="איך התחלת, מה למדת, מה חשוב לך בטיפול ומה מחכה ללקוחה אצלך" />
      </div>
      <FormMessage state={state} />
      <SubmitButton>שמירה</SubmitButton>
    </form>
  );
}
