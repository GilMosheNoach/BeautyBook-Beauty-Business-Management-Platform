"use client";

import { useActionState } from "react";
import { createClientAction, updateClientAction } from "@/server/actions/clients";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";

type Client = { id: string; name: string; phone: string; email: string; notes: string };

export function ClientForm({ client }: { client?: Client }) {
  const [state, action] = useActionState(client ? updateClientAction : createClientAction, undefined);
  return (
    <form action={action} className="space-y-3">
      {client && <input type="hidden" name="id" value={client.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">שם</label>
          <input className="input" name="name" defaultValue={client?.name} required />
        </div>
        <div>
          <label className="label">טלפון</label>
          <input className="input" name="phone" type="tel" dir="ltr" defaultValue={client?.phone} required />
        </div>
      </div>
      <div>
        <label className="label">אימייל (לא חובה)</label>
        <input className="input" name="email" type="email" dir="ltr" defaultValue={client?.email} />
      </div>
      <div>
        <label className="label">הערות (רגישויות, העדפות…)</label>
        <textarea className="input" name="notes" rows={3} defaultValue={client?.notes} />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full">{client ? "שמירה" : "הוספת לקוחה"}</SubmitButton>
    </form>
  );
}
