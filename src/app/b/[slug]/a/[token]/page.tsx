import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { whatsappNumber } from "@/lib/phone";
import { fmt, fmtTime } from "@/lib/time";
import { cancelByClientAction } from "@/server/actions/publicBooking";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";
export const metadata = { title: "התור שלי", robots: { index: false } };

function gcalDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export default async function ManageAppointmentPage({ params, searchParams }: { params: Promise<{ slug: string; token: string }>; searchParams: Promise<{ new?: string }> }) {
  const { slug, token } = await params;
  const { new: isNew } = await searchParams;
  const appt = await db.appointment.findUnique({ where: { manageToken: token }, include: { business: true, client: true } });
  if (!appt || appt.business.slug !== slug) notFound();
  const b = appt.business;
  const tz = b.timezone;
  const active = appt.status === "PENDING" || appt.status === "CONFIRMED";
  const canCancel = active && appt.startsAt > new Date();
  const gcal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${appt.serviceName} · ${b.name}`)}&dates=${gcalDate(appt.startsAt)}/${gcalDate(appt.endsAt)}&location=${encodeURIComponent(b.address)}`;

  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 py-10">
      {isNew && (
        <div className="mb-6 text-center">
          <div className="text-5xl">{appt.status === "PENDING" ? "⏳" : "✨"}</div>
          <h1 className="mt-3 text-2xl font-extrabold">{appt.status === "PENDING" ? "הבקשה נשלחה!" : "התור נקבע!"}</h1>
          <p className="mt-1 text-stone-600">
            {appt.status === "PENDING" ? `${b.name} תאשר את התור בהקדם.` : "מחכות לראות אותך."} שמרי את הדף הזה כדי לצפות בתור או לבטל אותו.
          </p>
        </div>
      )}
      <section className="card space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="muted">{b.name}</p>
            <h2 className="text-xl font-bold">{appt.serviceName}</h2>
          </div>
          <StatusBadge status={appt.status} />
        </div>
        <p className="text-lg">{fmt(appt.startsAt, tz, "EEEE, d בMMMM")}</p>
        <p className="text-lg font-semibold">{fmtTime(appt.startsAt, tz)}–{fmtTime(appt.endsAt, tz)}</p>
        <p className="muted">{formatPrice(appt.priceAgorot)} · על שם {appt.client.name}</p>
        {b.address && <p className="text-sm text-stone-600">📍 {b.address}</p>}
        <div className="flex flex-wrap gap-2 pt-2">
          {active && <a className="btn-secondary" href={gcal} target="_blank" rel="noreferrer">הוספה ליומן</a>}
          {b.phone && (
            <a className="btn-secondary" href={`https://wa.me/${whatsappNumber(b.phone)}`} target="_blank" rel="noreferrer">
              וואטסאפ לעסק
            </a>
          )}
        </div>
        {canCancel && (
          <form action={cancelByClientAction} className="border-t border-stone-100 pt-3">
            <input type="hidden" name="token" value={token} />
            <button className="btn-danger w-full">ביטול התור</button>
          </form>
        )}
      </section>
      <p className="mt-6 text-center">
        <Link href={`/b/${b.slug}`} className="text-sm font-medium text-brand-700">קביעת תור נוסף</Link>
      </p>
    </main>
  );
}
