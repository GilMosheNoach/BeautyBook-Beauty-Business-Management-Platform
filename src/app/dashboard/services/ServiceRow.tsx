"use client";

import { useState } from "react";
import { deleteServiceAction, toggleServiceAction } from "@/server/actions/services";
import { ServiceForm } from "./ServiceForm";

type Service = { id: string; name: string; description: string; durationMin: number; price: number; priceLabel: string; active: boolean };

export function ServiceRow({ service }: { service: Service }) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <li className="py-4">
        <ServiceForm service={service} onDone={() => setEditing(false)} />
        <button className="btn-ghost btn-sm mt-2" onClick={() => setEditing(false)}>ביטול</button>
      </li>
    );
  }
  return (
    <li className={`flex flex-wrap items-center justify-between gap-3 py-3 ${service.active ? "" : "opacity-60"}`}>
      <div className="min-w-0">
        <p className="font-medium">
          {service.name} {!service.active && <span className="badge bg-stone-200 text-stone-600">מוסתר</span>}
        </p>
        <p className="muted">{service.durationMin} דק׳ · {service.priceLabel}</p>
        {service.description && <p className="mt-1 text-sm text-stone-600">{service.description}</p>}
      </div>
      <div className="flex gap-1">
        <button className="btn-ghost btn-sm" onClick={() => setEditing(true)}>עריכה</button>
        <form action={toggleServiceAction}>
          <input type="hidden" name="id" value={service.id} />
          <input type="hidden" name="active" value={String(!service.active)} />
          <button className="btn-ghost btn-sm">{service.active ? "הסתרה" : "הצגה"}</button>
        </form>
        <form
          action={deleteServiceAction}
          onSubmit={(e) => {
            if (!confirm(`למחוק את "${service.name}"?`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={service.id} />
          <button className="btn-ghost btn-sm text-red-700">מחיקה</button>
        </form>
      </div>
    </li>
  );
}
