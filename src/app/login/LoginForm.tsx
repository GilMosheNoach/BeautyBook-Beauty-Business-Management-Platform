"use client";

import { useActionState } from "react";
import { loginAction } from "@/server/actions/auth";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";

export function LoginForm() {
  const [state, action] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">אימייל</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" dir="ltr" required />
      </div>
      <div>
        <label className="label" htmlFor="password">סיסמה</label>
        <input className="input" id="password" name="password" type="password" autoComplete="current-password" dir="ltr" required />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingText="מתחברת…">התחברות</SubmitButton>
    </form>
  );
}
