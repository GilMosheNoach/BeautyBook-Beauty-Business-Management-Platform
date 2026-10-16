import Link from "next/link";
import type { Appointment, Client } from "@prisma/client";
import { db } from "@/lib/db";
import { requireBusiness } from "@/lib/session";
import { formatPrice } from "@/lib/money";
import { addDaysToKey, fmt, fmtTime, isDateKey, localDateKey, localMinutesToDate, minutesToHHMM, weekdayOf } from "@/lib/time";
import { businessUrl } from "@/lib/url";
import { changeStatusAction } from "@/server/actions/appointments";
import { CopyButton } from "@/components/CopyButton";
import { StatusBadge } from "@/components/StatusBadge";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/Icons";
import { NowLine } from "./NowLine";

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

  // The grid covers working hours, and stretches for appointments booked outside them (e.g. a manual 21:30).
  const apptMinutes = appointments.flatMap((a) => {
    const startDay = localDateKey(a.startsAt, tz);
    const endsNextDay = localDateKey(a.endsAt, tz) !== startDay;
    return [localMinutes(a.startsAt, tz), endsNextDay ? 24 * 60 : localMinutes(a.endsAt, tz)];
  });
  const gridStart = Math.min(8 * 60, ...[...hours.map((h) => h.startMin), ...apptMinutes].map((m) => Math.floor(m / 60) * 60));
  const gridEnd = Math.max(20 * 60, ...[...hours.map((h) => h.endMin), ...apptMinutes].map((m) => Math.ceil(m / 60) * 60));
  const hourMarks = Array.from({ length: (gridEnd - gridStart) / 60 }, (_, i) => gridStart + i * 60);
  const bookingUrl = businessUrl(business.slug);
  const step = view === "week" ? 7 : 1;
  const nav = (d: string) => `/dashboard?date=${d}&view=${view}`;

  return (
    <div className="space-y-5">
      {(sp.welcome || serviceCount === 0) && (
        <section className="card border-stone-900 bg-ivory">
          <p className="eyebrow">ברוכה הבאה</p>
          <h2 className="mt-1 font-serif text-2xl font-extralight">העסק שלך באוויר</h2>
          <p className="mt-1 text-sm text-stone-700">
            זה הקישור שלך להזמנת תורים. שלחי אותו ללקוחות או שימי אותו בביו של האינסטגרם.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm" dir="ltr">{bookingUrl}</code>
            <CopyButton text={bookingUrl} />
          </div>
          {serviceCount === 0 && (
            <p className="mt-3 text-sm text-stone-900">
              עוד לא הגדרת שירותים, ולכן לקוחות לא יכולות להזמין. <Link className="font-semibold underline" href="/dashboard/services">הוספת שירות</Link>
            </p>
          )}
        </section>
      )}

      {pending.length > 0 && (
        <section className="card border-stone-900">
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
          <Link href={nav(addDaysToKey(date, -step))} className="btn-ghost btn-sm border border-stone-300 px-2" aria-label="הקודם"><ChevronRightIcon size={16} /></Link>
          <Link href={nav(today)} className="btn-ghost btn-sm border border-stone-300">היום</Link>
          <Link href={nav(addDaysToKey(date, step))} className="btn-ghost btn-sm border border-stone-300 px-2" aria-label="הבא"><ChevronLeftIcon size={16} /></Link>
          <h1 className="ms-3 font-serif text-2xl font-extralight">
            {view === "day"
              ? fmt(localMinutesToDate(date, 12 * 60, tz), tz, "EEEE, d בMMMM")
              : `${fmt(localMinutesToDate(days[0], 720, tz), tz, "d.M")} – ${fmt(localMinutesToDate(days[6], 720, tz), tz, "d.M.yyyy")}`}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-stone-300 bg-ivory text-sm">
            <Link href={`/dashboard?date=${date}&view=day`} className={`px-4 py-1.5 ${view === "day" ? "bg-stone-900 text-ivory" : "text-stone-600"}`}>יום</Link>
            <Link href={`/dashboard?date=${date}&view=week`} className={`px-4 py-1.5 ${view === "week" ? "bg-stone-900 text-ivory" : "text-stone-600"}`}>שבוע</Link>
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
                  className={`py-3 text-center text-sm ${d === today ? "font-semibold text-brand-600" : "text-stone-600"}`}
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
                  <div className="absolute inset-0 bg-stone-100" />
                  {working.map((h) => (
                    <div key={h.id} className="absolute inset-x-0 bg-ivory" style={{ top: (h.startMin - gridStart) * PX_PER_MIN, height: (h.endMin - h.startMin) * PX_PER_MIN }} />
                  ))}
                  {hourMarks.map((m) => (
                    <Link
                      key={m}
                      href={`/dashboard/appointments/new?date=${d}&time=${minutesToHHMM(m)}`}
                      className="absolute inset-x-0 border-t border-stone-100 hover:bg-nude/40"
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
                        className="pointer-events-none absolute inset-x-1 rounded-lg bg-[repeating-linear-gradient(45deg,#e5e5e5_0,#e5e5e5_6px,#f3f3f3_6px,#f3f3f3_12px)] p-1 text-xs text-stone-600"
                        style={{ top: (top - gridStart) * PX_PER_MIN, height: (bottom - top) * PX_PER_MIN }}
                      >
                        {t.reason || "חסום"}
                      </div>
                    );
                  })}
                  {dayAppts.map((a) => (
                    <ApptBlock key={a.id} a={a} tz={tz} top={(clampTop(a.startsAt) - gridStart) * PX_PER_MIN} height={Math.max(22, (clampBottom(a.endsAt) - clampTop(a.startsAt)) * PX_PER_MIN)} compact={view === "week"} />
                  ))}
                  {d === today && <NowLine tz={tz} gridStart={gridStart} gridEnd={gridEnd} pxPerMin={PX_PER_MIN} />}
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
      ? "border border-dashed border-stone-500 bg-ivory text-stone-900"
      : a.status === "COMPLETED"
        ? "border border-stone-300 bg-stone-100 text-stone-700"
        : a.status === "NO_SHOW"
          ? "border border-red-200 bg-red-50 text-red-900"
          : "border-s-2 border-stone-900 bg-stone-100 text-stone-900";
  return (
    <Link
      href={`/dashboard/appointments/${a.id}`}
      className={`absolute inset-x-1 overflow-hidden rounded-lg px-2 py-1 text-xs hover:z-10 hover:shadow-md ${color}`}
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
