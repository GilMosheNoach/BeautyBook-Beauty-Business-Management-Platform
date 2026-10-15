"use client";

import { useActionState } from "react";
import type { Business } from "@prisma/client";
import { updateSettingsAction } from "@/server/actions/business";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";

export function SettingsForm({ business, baseUrl }: { business: Business; baseUrl: string }) {
  const [state, action] = useActionState(updateSettingsAction, undefined);
  return (
    <form action={action} className="space-y-5">
      <section className="card space-y-4">
        <h2 className="h2">פרטי העסק</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">שם העסק</label>
            <input className="input" name="name" defaultValue={business.name} required />
          </div>
          <div>
            <label className="label">כתובת הדף</label>
            <div className="flex overflow-hidden rounded-xl border border-stone-300 bg-white" dir="ltr">
              <span className="flex items-center bg-stone-100 px-2 text-xs text-stone-500">{baseUrl}/b/</span>
              <input className="min-w-0 flex-1 px-3 py-2.5 text-base outline-none sm:text-sm" name="slug" defaultValue={business.slug} required />
            </div>
          </div>
          <div>
            <label className="label">טלפון</label>
            <input className="input" name="phone" type="tel" dir="ltr" defaultValue={business.phone} />
          </div>
          <div>
            <label className="label">כתובת</label>
            <input className="input" name="address" defaultValue={business.address} />
          </div>
          <div>
            <label className="label">אינסטגרם</label>
            <input className="input" name="instagram" dir="ltr" defaultValue={business.instagram} placeholder="username" />
          </div>
        </div>
        <div>
          <label className="label">כמה מילים על העסק</label>
          <textarea className="input" name="about" rows={3} defaultValue={business.about} placeholder="מופיע בראש דף ההזמנות" />
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="h2">כללי הזמנה</h2>
        <fieldset className="space-y-2">
          <legend className="label">תורים חדשים מהדף</legend>
          <label className="flex items-start gap-3 rounded-xl border border-stone-200 p-3 has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50">
            <input type="radio" name="bookingMode" value="APPROVAL" defaultChecked={business.bookingMode === "APPROVAL"} className="mt-1 accent-brand-600" />
            <span><span className="font-medium">דורשים את האישור שלי</span><br /><span className="muted">הלקוחה שולחת בקשה, ואת מאשרת או דוחה ביומן.</span></span>
          </label>
          <label className="flex items-start gap-3 rounded-xl border border-stone-200 p-3 has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50">
            <input type="radio" name="bookingMode" value="AUTO" defaultChecked={business.bookingMode === "AUTO"} className="mt-1 accent-brand-600" />
            <span><span className="font-medium">מאושרים אוטומטית</span><br /><span className="muted">התור נכנס ליומן מיד.</span></span>
          </label>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">מרווח בין שעות להצגה</label>
            <select className="input" name="slotStepMin" defaultValue={business.slotStepMin}>
              {[10, 15, 20, 30, 60].map((n) => <option key={n} value={n}>כל {n} דקות</option>)}
            </select>
          </div>
          <div>
            <label className="label">הפסקה בין תורים (דקות)</label>
            <input className="input" name="bufferMin" type="number" min={0} max={120} step={5} defaultValue={business.bufferMin} />
          </div>
          <div>
            <label className="label">התראה מינימלית לפני תור</label>
            <select className="input" name="minNoticeMin" defaultValue={business.minNoticeMin}>
              <option value={0}>ללא</option>
              <option value={60}>שעה</option>
              <option value={120}>שעתיים</option>
              <option value={240}>4 שעות</option>
              <option value={720}>12 שעות</option>
              <option value={1440}>יום</option>
              <option value={2880}>יומיים</option>
            </select>
          </div>
          <div>
            <label className="label">אפשר להזמין עד (ימים קדימה)</label>
            <input className="input" name="maxAdvanceDays" type="number" min={1} max={365} defaultValue={business.maxAdvanceDays} />
          </div>
        </div>
      </section>

      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full sm:w-auto">שמירת הגדרות</SubmitButton>
    </form>
  );
}
