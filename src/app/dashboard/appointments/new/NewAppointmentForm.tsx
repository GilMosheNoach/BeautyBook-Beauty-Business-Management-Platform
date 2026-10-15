"use client";

import { useActionState, useState } from "react";
import { createManualAppointmentAction } from "@/server/actions/appointments";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";

type Props = {
  services: { id: string; name: string; durationMin: number; price: string }[];
  clients: { id: string; name: string; phone: string }[];
  date: string;
  time: string;
  clientId?: string;
};

export function NewAppointmentForm({ services, clients, date, time, clientId }: Props) {
  const [state, action] = useActionState(createManualAppointmentAction, undefined);
  const [mode, setMode] = useState<"existing" | "new">(clients.length && clientId !== "" ? "existing" : "new");
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const service = services.find((s) => s.id === serviceId);

  return (
    <form action={action} className="card space-y-4">
      <div>
        <span className="label">לקוחה</span>
        <div className="mb-2 flex rounded-xl border border-stone-300 bg-white p-0.5 text-sm">
          <button type="button" onClick={() => setMode("existing")} disabled={!clients.length} className={`flex-1 rounded-lg px-3 py-1.5 ${mode === "existing" ? "bg-brand-600 text-white" : ""}`}>
            קיימת
          </button>
          <button type="button" onClick={() => setMode("new")} className={`flex-1 rounded-lg px-3 py-1.5 ${mode === "new" ? "bg-brand-600 text-white" : ""}`}>
            חדשה
          </button>
        </div>
        {mode === "existing" ? (
          <select className="input" name="clientId" defaultValue={clientId} required>
            <option value="">בחרי לקוחה…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>
            ))}
          </select>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input" name="clientName" placeholder="שם הלקוחה" required />
            <input className="input" name="clientPhone" type="tel" dir="ltr" placeholder="050-0000000" required />
          </div>
        )}
      </div>
      <div>
        <label className="label" htmlFor="serviceId">שירות</label>
        <select className="input" id="serviceId" name="serviceId" value={serviceId} onChange={(e) => setServiceId(e.target.value)} required>
          {services.map((s) => (
            <option key={s.id} value={s.id}>{s.name} · {s.durationMin} דק׳ · {s.price}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label" htmlFor="date">תאריך</label>
          <input className="input" id="date" name="date" type="date" defaultValue={date} required />
        </div>
        <div>
          <label className="label" htmlFor="time">שעה</label>
          <input className="input" id="time" name="time" type="time" step={300} defaultValue={time} required />
        </div>
        <div>
          <label className="label" htmlFor="durationMin">משך (דק׳)</label>
          <input className="input" id="durationMin" name="durationMin" type="number" min={5} step={5} placeholder={String(service?.durationMin ?? "")} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="note">הערה</label>
        <textarea className="input" id="note" name="note" rows={2} />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingText="קובעת…">קביעת התור</SubmitButton>
    </form>
  );
}
