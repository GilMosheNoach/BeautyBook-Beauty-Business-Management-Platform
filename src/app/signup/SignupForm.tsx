"use client";

import { useActionState } from "react";
import { signupAction } from "@/server/actions/auth";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";

export function SignupForm() {
  const [state, action] = useActionState(signupAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="name">שם מלא</label>
        <input className="input" id="name" name="name" autoComplete="name" required />
      </div>
      <div>
        <label className="label" htmlFor="email">אימייל</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" dir="ltr" required />
      </div>
      <div>
        <label className="label" htmlFor="password">סיסמה</label>
        <input className="input" id="password" name="password" type="password" autoComplete="new-password" minLength={8} dir="ltr" required />
        <p className="muted mt-1">8 תווים לפחות</p>
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingText="יוצרת חשבון…">יצירת חשבון</SubmitButton>
    </form>
  );
}
