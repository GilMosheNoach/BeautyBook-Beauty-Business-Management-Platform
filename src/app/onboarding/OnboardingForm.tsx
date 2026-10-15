"use client";

import { useActionState, useState } from "react";
import { createBusinessAction } from "@/server/actions/business";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import { STARTER_SERVICES } from "@/lib/starterServices";
import { normalizeSlug } from "@/lib/slug";

export function OnboardingForm({ baseUrl }: { baseUrl: string }) {
  const [state, action] = useActionState(createBusinessAction, undefined);
  const [slug, setSlug] = useState("");
  return (
    <form action={action} className="space-y-6">
      <section className="card space-y-4">
        <h2 className="h2">1. פרטי העסק</h2>
        <div>
          <label className="label" htmlFor="name">שם העסק</label>
          <input className="input" id="name" name="name" placeholder="לדוגמה: סטודיו יופי של מיכל" required />
        </div>
        <div>
          <label className="label" htmlFor="slug">כתובת הדף שלך</label>
          <div className="flex items-stretch overflow-hidden rounded-xl border border-stone-300 bg-ivory focus-within:border-stone-900" dir="ltr">
            <span className="flex items-center bg-stone-100 px-3 text-sm text-stone-500">{baseUrl}/b/</span>
            <input
              className="min-w-0 flex-1 px-3 py-2.5 text-base outline-none sm:text-sm"
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => setSlug(normalizeSlug(e.target.value))}
              placeholder="michal-beauty"
              required
            />
          </div>
          <p className="muted mt-1">באנגלית בלבד. זה הקישור שתשלחי ללקוחות.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="phone">טלפון העסק</label>
            <input className="input" id="phone" name="phone" type="tel" dir="ltr" placeholder="050-0000000" />
          </div>
          <div>
            <label className="label" htmlFor="address">כתובת</label>
            <input className="input" id="address" name="address" placeholder="רחוב, עיר" />
          </div>
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="h2">2. שירותים ראשונים</h2>
        <p className="muted">סמני מה את נותנת. מחירים ומשכים אפשר לשנות אחר כך.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {STARTER_SERVICES.map((s) => (
            <label key={s.key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 p-3 has-[:checked]:border-stone-900 has-[:checked]:bg-stone-100">
              <input type="checkbox" name="starter" value={s.key} className="h-4 w-4 accent-brand-600" />
              <span className="flex-1 text-sm font-medium">{s.name}</span>
              <span className="text-xs text-stone-500">{s.durationMin} דק׳ · ₪{s.price}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="h2">3. שעות עבודה</h2>
        <p className="muted mt-1">התחלנו עם א׳–ה׳ 09:00–18:00 ו-ו׳ 09:00–13:00. תוכלי לשנות במסך הזמינות.</p>
      </section>

      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingText="מקימה את העסק…">יצירת העסק</SubmitButton>
    </form>
  );
}
