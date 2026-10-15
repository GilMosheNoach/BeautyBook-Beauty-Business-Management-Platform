"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveServiceAction } from "@/server/actions/services";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";

type Service = { id: string; name: string; description: string; durationMin: number; price: number };

export function ServiceForm({ service, onDone }: { service?: Service; onDone?: () => void }) {
  const [state, action] = useActionState(saveServiceAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      if (!service) formRef.current?.reset();
      onDone?.();
    }
  }, [state, service, onDone]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      {service && <input type="hidden" name="id" value={service.id} />}
      <div>
        <label className="label">שם השירות</label>
        <input className="input" name="name" defaultValue={service?.name} placeholder="לדוגמה: טיפול פנים" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">משך (דקות)</label>
          <input className="input" name="durationMin" type="number" min={5} step={5} defaultValue={service?.durationMin ?? 60} required />
        </div>
        <div>
          <label className="label">מחיר (₪)</label>
          <input className="input" name="price" type="number" min={0} step="any" defaultValue={service?.price} required />
        </div>
      </div>
      <div>
        <label className="label">תיאור (לא חובה)</label>
        <textarea className="input" name="description" rows={2} defaultValue={service?.description} />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full">{service ? "שמירה" : "הוספת שירות"}</SubmitButton>
    </form>
  );
}
