"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bookAppointmentAction } from "@/server/actions/publicBooking";

type Service = { id: string; name: string; description: string; durationMin: number; priceLabel: string };
type Day = { date: string; slots: string[] };
type Invite = { token: string; clientName: string; clientPhone: string } | null;

type Props = { slug: string; services: Service[]; timezone: string; invite: Invite; requiresApproval: boolean; initialServiceId: string | null };

function nextDateKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

export function BookingFlow({ slug, services, timezone, invite, requiresApproval, initialServiceId }: Props) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState<string | null>(initialServiceId);
  const [days, setDays] = useState<Day[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const service = services.find((s) => s.id === serviceId) ?? null;
  const timeFmt = useMemo(() => new Intl.DateTimeFormat("he-IL", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: false }), [timezone]);
  const dayFmt = useMemo(() => new Intl.DateTimeFormat("he-IL", { timeZone: "UTC", weekday: "short" }), []);
  const longFmt = useMemo(() => new Intl.DateTimeFormat("he-IL", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }), []);
  const keyToDate = (k: string) => new Date(k + "T12:00:00Z");

  const load = useCallback(
    async (from?: string, replace = false) => {
      if (!serviceId) return;
      setLoading(true);
      try {
        const qs = new URLSearchParams({ serviceId, days: "14", ...(from ? { from } : {}) });
        const res = await fetch(`/api/public/${slug}/availability?${qs}`, { cache: "no-store" });
        const data = (await res.json()) as { days?: Day[] };
        const fresh = data.days ?? [];
        setHasMore(fresh.length === 14);
        setDays((prev) => (replace ? fresh : [...prev, ...fresh]));
        if (replace) {
          setDate((cur) => (cur && fresh.some((d) => d.date === cur && d.slots.length) ? cur : fresh.find((d) => d.slots.length)?.date ?? null));
        }
      } finally {
        setLoading(false);
      }
    },
    [serviceId, slug],
  );

  useEffect(() => {
    setDays([]);
    setSlot(null);
    setDate(null);
    if (serviceId) load(undefined, true);
  }, [serviceId, load]);

  const selectedDay = days.find((d) => d.date === date);

  function submit(form: FormData) {
    if (!service || !slot) return;
    setError(null);
    startTransition(async () => {
      const res = await bookAppointmentAction({
        slug,
        serviceId: service.id,
        startsAt: slot,
        name: String(form.get("name") ?? ""),
        phone: String(form.get("phone") ?? ""),
        note: String(form.get("note") ?? ""),
        invite: invite?.token ?? "",
        website: String(form.get("website") ?? ""),
      });
      if (res.ok) {
        router.push(`/b/${slug}/a/${res.token}?new=1`);
        return;
      }
      setError(res.error);
      if (res.slotTaken) {
        setSlot(null);
        load(undefined, true);
      }
    });
  }

  return (
    <div className="space-y-14">
      {/* Step 1: service */}
      <section>
        <StepTitle n="01">בחירת טיפול</StepTitle>
        {services.length === 0 && <p className="muted">עוד לא הוגדרו שירותים להזמנה.</p>}
        <div className="border-t border-stone-200">
          {services.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setServiceId(s.id)}
              aria-pressed={s.id === serviceId}
              className={`flex w-full items-center justify-between gap-3 border-b border-stone-200 px-4 py-5 text-start transition ${s.id === serviceId ? "bg-stone-50 shadow-[inset_-2px_0_0_theme(colors.brand.600)]" : "hover:bg-stone-50"}`}
            >
              <span className="min-w-0">
                <span className="block font-serif font-light text-lg">{s.name}</span>
                {s.description && <span className="mt-0.5 block text-sm text-stone-500">{s.description}</span>}
                <span className="mt-1 block text-xs tracking-wide text-stone-500">{s.durationMin} דקות</span>
              </span>
              <span className="shrink-0 font-serif font-light text-lg">{s.priceLabel}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Step 2: day + time */}
      {service && (
        <section>
          <StepTitle n="02">בחירת מועד</StepTitle>
          {loading && days.length === 0 ? (
            <p className="muted">טוענת שעות פנויות…</p>
          ) : (
            <>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
                {days.map((d) => {
                  const dt = keyToDate(d.date);
                  const disabled = d.slots.length === 0;
                  return (
                    <button
                      key={d.date}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        setDate(d.date);
                        setSlot(null);
                      }}
                      className={`flex w-14 shrink-0 flex-col items-center border py-2.5 text-sm transition disabled:opacity-35 ${d.date === date ? "border-stone-900 bg-stone-900 text-ivory" : "border-stone-300 bg-ivory hover:border-stone-900"}`}
                    >
                      <span className="text-xs">{dayFmt.format(dt)}</span>
                      <span className="font-serif font-light text-xl">{dt.getUTCDate()}</span>
                      <span className="text-[10px] opacity-70">{dt.getUTCMonth() + 1}/{String(dt.getUTCFullYear()).slice(2)}</span>
                    </button>
                  );
                })}
                {hasMore && days.length > 0 && (
                  <button type="button" disabled={loading} onClick={() => load(nextDateKey(days.at(-1)!.date))} className="shrink-0 border border-dashed border-stone-300 px-3 text-sm text-stone-600">
                    {loading ? "…" : "עוד ימים"}
                  </button>
                )}
              </div>
              {days.length > 0 && !days.some((d) => d.slots.length) && (
                <p className="muted mt-2">אין שעות פנויות בימים האלה. נסי &quot;עוד ימים&quot;.</p>
              )}
              {selectedDay && (
                <div className="mt-5">
                  <p className="mb-3 text-sm text-stone-600">{longFmt.format(keyToDate(selectedDay.date))}</p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {selectedDay.slots.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSlot(s)}
                        aria-pressed={s === slot}
                        className={`border py-3 text-sm transition ${s === slot ? "border-brand-600 bg-brand-600 text-ivory" : "border-stone-300 bg-ivory hover:border-stone-900"}`}
                      >
                        {timeFmt.format(new Date(s))}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* Step 3: details */}
      {service && slot && (
        <section>
          <StepTitle n="03">הפרטים שלך</StepTitle>
          <p className="muted -mt-2 mb-5">
            {service.name} · {longFmt.format(keyToDate(date!))} בשעה {timeFmt.format(new Date(slot))}
          </p>
          <form action={submit} className="space-y-4">
            <div>
              <label className="label" htmlFor="bk-name">שם מלא</label>
              <input className="input" id="bk-name" name="name" autoComplete="name" defaultValue={invite?.clientName} required minLength={2} />
            </div>
            <div>
              <label className="label" htmlFor="bk-phone">טלפון</label>
              <input className="input" id="bk-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" defaultValue={invite?.clientPhone} placeholder="050-0000000" required />
            </div>
            <div>
              <label className="label" htmlFor="bk-note">הערה (לא חובה)</label>
              <textarea className="input" id="bk-note" name="note" rows={2} />
            </div>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button type="submit" className="btn-primary w-full py-4 text-base tracking-[0.15em]" disabled={pending}>
              {pending ? "שולחת…" : requiresApproval ? "שליחת בקשה לתור" : "קביעת התור"}
            </button>
            {requiresApproval && <p className="muted text-center">התור יאושר סופית על ידי בעלת העסק.</p>}
            <p className="text-center text-xs text-stone-500">
              השם והטלפון יועברו לבעלת העסק לצורך התור בלבד. פרטים ב
              <a href="/privacy" target="_blank" className="underline underline-offset-4">מדיניות הפרטיות</a>.
            </p>
          </form>
        </section>
      )}
      {error && !slot && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}

function StepTitle({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <h3 className="mb-5 flex items-baseline gap-3">
      <span className="font-display text-2xl lining-nums text-brand-600">{n}</span>
      <span className="font-serif text-2xl font-extralight">{children}</span>
    </h3>
  );
}
