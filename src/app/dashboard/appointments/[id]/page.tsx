import Link from "next/link";
import { NoteIcon, PhoneIcon } from "@/components/Icons";
import { notFound } from "next/navigation";
import type { AppointmentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireBusiness } from "@/lib/session";
import { formatPrice } from "@/lib/money";
import { whatsappNumber } from "@/lib/phone";
import { fmt, fmtTime } from "@/lib/time";
import { appUrl } from "@/lib/url";
import { changeStatusAction } from "@/server/actions/appointments";
import { StatusBadge } from "@/components/StatusBadge";
import { CopyButton } from "@/components/CopyButton";

export const metadata = { title: "פרטי תור" };

const SOURCE_LABEL = { ONLINE: "הזמנה מהדף", MANUAL: "נקבע ידנית", INVITE: "מהזמנה אישית" } as const;

function actionsFor(status: AppointmentStatus, isPast: boolean): { status: AppointmentStatus; label: string; cls: string }[] {
  switch (status) {
    case "PENDING":
      return [
        { status: "CONFIRMED", label: "אישור התור", cls: "btn-primary" },
        { status: "REJECTED", label: "דחייה", cls: "btn-danger" },
      ];
    case "CONFIRMED":
      return isPast
        ? [
            { status: "COMPLETED", label: "סימון כהושלם", cls: "btn-primary" },
            { status: "NO_SHOW", label: "לא הגיעה", cls: "btn-secondary" },
          ]
        : [{ status: "CANCELLED", label: "ביטול התור", cls: "btn-danger" }];
    case "COMPLETED":
    case "NO_SHOW":
      return [{ status: "CONFIRMED", label: "החזרה למאושר", cls: "btn-secondary" }];
    default:
      return isPast ? [] : [{ status: "CONFIRMED", label: "שחזור ואישור", cls: "btn-secondary" }];
  }
}

export default async function AppointmentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const business = await requireBusiness();
  const { id } = await params;
  const { created } = await searchParams;
  const a = await db.appointment.findFirst({ where: { id, businessId: business.id }, include: { client: true } });
  if (!a) notFound();
  const tz = business.timezone;
  const isPast = a.startsAt < new Date();
  const dateKey = fmt(a.startsAt, tz, "yyyy-MM-dd");
  const manageUrl = appUrl(`/b/${business.slug}/a/${a.manageToken}`);
  const confirmText = `היי ${a.client.name}, התור שלך ל${a.serviceName} ב${business.name} נקבע ל${fmt(a.startsAt, tz, "EEEE d.M")} בשעה ${fmtTime(a.startsAt, tz)}. פרטים וביטול: ${manageUrl}`;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href={`/dashboard?date=${dateKey}`} className="muted">→ חזרה ליומן</Link>
      {created && <p className="rounded-xl bg-stone-100 px-3 py-2 text-sm text-stone-900">התור נקבע ✓</p>}
      <section className="card space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="h1">{a.serviceName}</h1>
            <p className="mt-1 text-stone-700">{fmt(a.startsAt, tz, "EEEE, d בMMMM yyyy")}</p>
            <p className="text-stone-700">{fmtTime(a.startsAt, tz)}–{fmtTime(a.endsAt, tz)}</p>
          </div>
          <StatusBadge status={a.status} />
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="muted">מחיר</dt><dd className="font-medium">{formatPrice(a.priceAgorot)}</dd></div>
          <div><dt className="muted">מקור</dt><dd className="font-medium">{SOURCE_LABEL[a.source]}</dd></div>
        </dl>
        {a.note && <p className="flex gap-2 rounded-xl bg-stone-50 p-3 text-sm"><NoteIcon size={18} className="shrink-0 text-stone-500" />{a.note}</p>}
        <div className="flex flex-wrap gap-2">
          {actionsFor(a.status, isPast).map((act) => (
            <form key={act.status} action={changeStatusAction}>
              <input type="hidden" name="id" value={a.id} />
              <input type="hidden" name="status" value={act.status} />
              <button className={act.cls}>{act.label}</button>
            </form>
          ))}
        </div>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="h2">{a.client.name}</h2>
          <Link className="text-sm font-medium text-brand-600 underline underline-offset-4" href={`/dashboard/clients/${a.client.id}`}>כרטיס לקוחה</Link>
        </div>
        <p dir="ltr" className="text-end text-stone-700">{a.client.phone}</p>
        <div className="flex flex-wrap gap-2">
          <a className="btn-secondary" href={`tel:${a.client.phone}`}><PhoneIcon size={16} /> התקשרות</a>
          <a className="btn-secondary" target="_blank" rel="noreferrer" href={`https://wa.me/${whatsappNumber(a.client.phone)}?text=${encodeURIComponent(confirmText)}`}>
            שליחת אישור בוואטסאפ
          </a>
          <CopyButton text={manageUrl} label="קישור לתור" />
        </div>
      </section>
    </div>
  );
}
