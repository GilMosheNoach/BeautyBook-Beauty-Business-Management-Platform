import Link from "next/link";
import type { Appointment, Client } from "@prisma/client";
import { db } from "@/lib/db";
import { requireBusiness } from "@/lib/session";
import { formatPrice } from "@/lib/money";
import { addDaysToKey, fmt, fmtTime, isDateKey, localDateKey, localMinutesToDate, minutesToHHMM, weekdayOf } from "@/lib/time";
import { appUrl } from "@/lib/url";
import { changeStatusAction } from "@/server/actions/appointments";
import { CopyButton } from "@/components/CopyButton";
import { StatusBadge } from "@/components/StatusBadge";

export const metadata = { title: "יומן" };

const PX_PER_MIN = 1.1;

type Appt = Appointment & { client: Client };

function localMinutes(date: Date, tz: string) {
  const [h, m] = fmtTime(date, tz).split(":").map(Number);
  return h * 60 + m;
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const business = await requireBusiness();
  const sp = await searchParams;
  const tz = business.timezone;
  const today = localDateKey(new Date(), tz);
  const date = isDateKey(sp.date) ? sp.date : today;
  const view = sp.view === "week" ? "week" : "day";

  const firstDay = view === "week" ? addDaysToKey(date, -weekdayOf(date)) : date;
  const dayCount = view === "week" ? 7 : 1;
  const days = Array.from({ length: dayCount }, (_, i) => addDaysToKey(firstDay, i));
  const rangeStart = localMinutesToDate(firstDay, 0, tz);
  const rangeEnd = localMinutesToDate(addDaysToKey(firstDay, dayCount), 0, tz);

  const [appointments, timeOff, hours, pending, serviceCount] = await Promise.all([
    db.appointment.findMany({
      where: {
        businessId: business.id,
        startsAt: { lt: rangeEnd },
        endsAt: { gt: rangeStart },
        status: { notIn: ["REJECTED", "CANCELLED"] },
      },
      include: { client: true },
      orderBy: { startsAt: "asc" },
    }),
    db.timeOff.findMany({
      where: { businessId: business.id, startsAt: { lt: rangeEnd }, endsAt: { gt: rangeStart } },
    }),
    db.workingHours.findMany({ where: { businessId: business.id } }),
    db.appointment.findMany({
      where: { businessId: business.id, status: "PENDING", startsAt: { gte: new Date() } },
      include: { client: true },
      orderBy: { startsAt: "asc" },
      take: 20,
    }),
    db.service.count({ where: { businessId: business.id, active: true } }),
  ]);

  const gridStart = Math.min(8 * 60, ...hours.map((h) => Math.floor(h.startMin / 60) * 60));
  const gridEnd = Math.max(20 * 60, ...hours.map((h) => Math.ceil(h.endMin / 60) * 60));
  const hourMarks = Array.from({ length: (gridEnd - gridStart) / 60 }, (_, i) => gridStart + i * 60);
  const bookingUrl = appUrl(`/b/${business.slug}`);
  const step = view === "week" ? 7 : 1;
  const nav = (d: string) => `/dashboard?date=${d}&view=${view}`;

  return (
    <div className="space-y-5">
      {(sp.welcome || serviceCount === 0) && (
        <section className="card border-brand-200 bg-brand-50">
          <h2 className="h2">העסק שלך באוויר 🎉</h2>
          <p className="mt-1 text-sm text-stone-700">
            זה הקישור שלך להזמנת תורים. שלחי אותו ללקוחות או שימי אותו בביו של האינסטגרם.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="rounded-lg bg-white px-3 py-2 text-sm" dir="ltr">{bookingUrl}</code>
            <CopyButton text={bookingUrl} />
          </div>
          {serviceCount === 0 && (
            <p className="mt-3 text-sm text-amber-800">
              עוד לא הגדרת שירותים, ולכן לקוחות לא יכולות להזמין. <Link className="font-semibold underline" href="/dashboard/services">הוספת שירות</Link>
            </p>
          )}
        </section>
      )}

      {pending.length > 0 && (
        <section className="card border-amber-200">
          <h2 className="h2">בקשות ממתינות לאישור ({pending.length})</h2>
          <ul className="mt-3 divide-y divide-stone-100">
            {pending.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <Link href={`/dashboard/appointments/${a.id}`} className="min-w-0">
                  <p className="font-medium">{a.client.name} · {a.serviceName}</p>
                  <p className="muted">{fmt(a.startsAt, tz, "EEEE d בMMMM, HH:mm")}</p>
                </Link>
                <div className="flex gap-2">
                  <form action={changeStatusAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="status" value="CONFIRMED" />
                    <button className="btn-primary btn-sm">אישור</button>
                  </form>
                  <form action={changeStatusAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="status" value="REJECTED" />
                    <button className="btn-danger btn-sm">דחייה</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={nav(addDaysToKey(date, -step))} className="btn-secondary btn-sm" aria-label="הקודם">→</Link>
          <Link href={nav(today)} className="btn-secondary btn-sm">היום</Link>
          <Link href={nav(addDaysToKey(date, step))} className="btn-secondary btn-sm" aria-label="הבא">←</Link>
          <h1 className="ms-2 text-lg font-bold">
            {view === "day"
              ? fmt(localMinutesToDate(date, 12 * 60, tz), tz, "EEEE, d בMMMM")
              : `${fmt(localMinutesToDate(days[0], 720, tz), tz, "d.M")} – ${fmt(localMinutesToDate(days[6], 720, tz), tz, "d.M.yyyy")}`}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-stone-300 bg-white p-0.5 text-sm">
            <Link href={`/dashboard?date=${date}&view=day`} className={`rounded-lg px-3 py-1 ${view === "day" ? "bg-brand-600 text-white" : ""}`}>יום</Link>
            <Link href={`/dashboard?date=${date}&view=week`} className={`rounded-lg px-3 py-1 ${view === "week" ? "bg-brand-600 text-white" : ""}`}>שבוע</Link>
          </div>
          <Link href={`/dashboard/appointments/new?date=${date}`} className="btn-primary btn-sm">+ תור חדש</Link>
        </div>
      </div>

      <div className="card overflow-x-auto p-0 sm:p-0">
        <div className={view === "week" ? "min-w-[760px]" : ""}>
          {view === "week" && (
            <div className="grid border-b border-stone-200" style={{ gridTemplateColumns: `3.5rem repeat(7, 1fr)` }}>
              <div />
              {days.map((d) => (
                <Link
                  key={d}
                  href={`/dashboard?date=${d}&view=day`}
                  className={`py-2 text-center text-sm ${d === today ? "font-bold text-brand-700" : "text-stone-600"}`}
                >
                  {fmt(localMinutesToDate(d, 720, tz), tz, "EEE d.M")}
                </Link>
              ))}
            </div>
          )}
          <div className="grid" style={{ gridTemplateColumns: `3.5rem repeat(${dayCount}, 1fr)` }}>
            <div className="relative" style={{ height: (gridEnd - gridStart) * PX_PER_MIN }}>
              {hourMarks.map((m) => (
                <div key={m} className="absolute inset-x-0 pe-2 text-end text-xs text-stone-400" style={{ top: (m - gridStart) * PX_PER_MIN - 6 }}>
                  {m > gridStart ? minutesToHHMM(m) : ""}
                </div>
              ))}
            </div>
            {days.map((d) => {
              const wd = weekdayOf(d);
              const dayStart = localMinutesToDate(d, 0, tz);
              const dayEnd = localMinutesToDate(addDaysToKey(d, 1), 0, tz);
              const dayAppts = appointments.filter((a) => a.startsAt < dayEnd && a.endsAt > dayStart);
              const dayOff = timeOff.filter((t) => t.startsAt < dayEnd && t.endsAt > dayStart);
              const working = hours.filter((h) => h.weekday === wd);
              const clampTop = (date: Date) => (date <= dayStart ? gridStart : Math.max(gridStart, localMinutes(date, tz)));
              const clampBottom = (date: Date) => (date >= dayEnd ? gridEnd : Math.min(gridEnd, localMinutes(date, tz)));
              return (
                <div key={d} className="relative border-s border-stone-100" style={{ height: (gridEnd - gridStart) * PX_PER_MIN }}>
                  {/* off-hours shading */}
                  <div className="absolute inset-0 bg-stone-100/70" />
                  {working.map((h) => (
                    <div key={h.id} className="absolute inset-x-0 bg-white" style={{ top: (h.startMin - gridStart) * PX_PER_MIN, height: (h.endMin - h.startMin) * PX_PER_MIN }} />
                  ))}
                  {hourMarks.map((m) => (
                    <Link
                      key={m}
                      href={`/dashboard/appointments/new?date=${d}&time=${minutesToHHMM(m)}`}
                      className="absolute inset-x-0 border-t border-stone-100 hover:bg-brand-50/60"
                      style={{ top: (m - gridStart) * PX_PER_MIN, height: 60 * PX_PER_MIN }}
                      aria-label={`תור חדש ב-${minutesToHHMM(m)}`}
                    />
                  ))}
                  {dayOff.map((t) => {
                    const top = clampTop(t.startsAt);
                    const bottom = clampBottom(t.endsAt);
                    if (bottom <= top) return null;
                    return (
                      <div
                        key={t.id}
                        className="pointer-events-none absolute inset-x-1 rounded-lg bg-[repeating-linear-gradient(45deg,#e7e5e4_0,#e7e5e4_6px,#f5f5f4_6px,#f5f5f4_12px)] p-1 text-xs text-stone-600"
                        style={{ top: (top - gridStart) * PX_PER_MIN, height: (bottom - top) * PX_PER_MIN }}
                      >
                        {t.reason || "חסום"}
                      </div>
                    );
                  })}
                  {dayAppts.map((a) => (
                    <ApptBlock key={a.id} a={a} tz={tz} top={(clampTop(a.startsAt) - gridStart) * PX_PER_MIN} height={Math.max(22, (clampBottom(a.endsAt) - clampTop(a.startsAt)) * PX_PER_MIN)} compact={view === "week"} />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {view === "day" && appointments.length === 0 && (
        <p className="muted text-center">אין תורים ביום הזה. לחצי על שעה ביומן כדי לקבוע תור.</p>
      )}
    </div>
  );
}

function ApptBlock({ a, tz, top, height, compact }: { a: Appt; tz: string; top: number; height: number; compact: boolean }) {
  const color =
    a.status === "PENDING"
      ? "border-amber-300 bg-amber-50 text-amber-900"
      : a.status === "COMPLETED"
        ? "border-sky-200 bg-sky-50 text-sky-900"
        : a.status === "NO_SHOW"
          ? "border-red-200 bg-red-50 text-red-900"
          : "border-brand-300 bg-brand-100 text-brand-900";
  return (
    <Link
      href={`/dashboard/appointments/${a.id}`}
      className={`absolute inset-x-1 overflow-hidden rounded-lg border px-2 py-1 text-xs shadow-sm hover:z-10 hover:shadow ${color}`}
      style={{ top, height }}
    >
      <p className="truncate font-semibold">
        {fmtTime(a.startsAt, tz)} {a.client.name}
      </p>
      {!compact && height > 36 && (
        <p className="truncate">
          {a.serviceName} · {formatPrice(a.priceAgorot)} {a.status === "PENDING" && <StatusBadge status={a.status} />}
        </p>
      )}
      {compact && height > 36 && <p className="truncate">{a.serviceName}</p>}
    </Link>
  );
}
