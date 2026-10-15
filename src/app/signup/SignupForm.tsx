"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signupAction } from "@/server/actions/auth";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";

export function SignupForm({ referralCode }: { referralCode: string }) {
  const [state, action] = useActionState(signupAction, undefined);
  return (
    <form action={action} className="space-y-4">
      {referralCode && <input type="hidden" name="ref" value={referralCode} />}
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
      <label className="flex items-start gap-2.5 text-sm text-stone-700">
        <input type="checkbox" name="acceptTerms" required className="mt-0.5 h-4 w-4 shrink-0 accent-stone-900" />
        <span>
          קראתי ואני מסכימה ל<Link href="/terms" target="_blank" className="underline underline-offset-4">תנאי השימוש</Link> ול
          <Link href="/privacy" target="_blank" className="underline underline-offset-4">מדיניות הפרטיות</Link>
        </span>
      </label>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingText="יוצרת חשבון…">המשך לתשלום</SubmitButton>
    </form>
  );
}
