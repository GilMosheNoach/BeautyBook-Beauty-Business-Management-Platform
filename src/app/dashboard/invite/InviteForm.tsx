"use client";

import { useActionState } from "react";
import { createInvitationAction } from "@/server/actions/invitations";
import { SubmitButton } from "@/components/SubmitButton";
import { CopyButton } from "@/components/CopyButton";
import { whatsappNumber } from "@/lib/phone";

type Props = {
  services: { id: string; name: string }[];
  defaults: { clientName: string; clientPhone: string };
  onAnother: () => void;
  onClose: () => void;
};

export function InviteForm({ services, defaults, onAnother, onClose }: Props) {
  const [state, action] = useActionState(createInvitationAction, undefined);

  if (state?.link) {
    const text = state.text ?? state.link;
    const wa = state.phone ? `https://wa.me/${whatsappNumber(state.phone)}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    return (
      <div className="space-y-4">
        <p className="rounded-xl bg-stone-100 px-3 py-2 text-sm text-stone-900">ההזמנה מוכנה! שלחי אותה ללקוחה:</p>
        <pre className="whitespace-pre-wrap break-all rounded-xl bg-stone-50 p-3 font-sans text-sm">{text}</pre>
        <div className="flex flex-wrap gap-2">
          <a className="btn-primary" href={wa} target="_blank" rel="noreferrer">שליחה בוואטסאפ</a>
          {state.phone && <a className="btn-secondary" href={`sms:${state.phone}?&body=${encodeURIComponent(text)}`}>שליחה ב-SMS</a>}
          <CopyButton text={text} label="העתקת ההודעה" />
        </div>
        <div className="flex gap-2 border-t border-stone-100 pt-3">
          <button type="button" onClick={onAnother} className="btn-ghost btn-sm">הזמנה נוספת</button>
          <button type="button" onClick={onClose} className="btn-ghost btn-sm">סגירה</button>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">שם הלקוחה</label>
          <input className="input" name="clientName" defaultValue={defaults.clientName} />
        </div>
        <div>
          <label className="label">טלפון</label>
          <input className="input" name="clientPhone" type="tel" dir="ltr" defaultValue={defaults.clientPhone} placeholder="050-0000000" />
        </div>
      </div>
      <div>
        <label className="label">שירות מוצע (לא חובה)</label>
        <select className="input" name="serviceId" defaultValue="">
          <option value="">הלקוחה תבחר</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">הודעה אישית (לא חובה)</label>
        <textarea className="input" name="message" rows={2} placeholder="לדוגמה: הגיע הזמן לטיפול הפנים הבא שלך" />
      </div>
      <div>
        <label className="label">תוקף ההזמנה</label>
        <select className="input" name="validDays" defaultValue="14">
          <option value="3">3 ימים</option>
          <option value="7">שבוע</option>
          <option value="14">שבועיים</option>
          <option value="30">חודש</option>
        </select>
      </div>
      {state?.error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <SubmitButton className="btn-primary w-full" pendingText="יוצרת…">יצירת הזמנה</SubmitButton>
    </form>
  );
}
