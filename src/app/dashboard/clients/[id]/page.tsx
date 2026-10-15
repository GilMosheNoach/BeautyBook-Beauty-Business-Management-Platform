import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireBusiness } from "@/lib/session";
import { formatPrice } from "@/lib/money";
import { whatsappNumber } from "@/lib/phone";
import { fmt } from "@/lib/time";
import { StatusBadge } from "@/components/StatusBadge";
import { ClientForm } from "../ClientForm";

export const metadata = { title: "כרטיס לקוחה" };

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const business = await requireBusiness();
  const { id } = await params;
  const client = await db.client.findFirst({
    where: { id, businessId: business.id },
    include: { appointments: { orderBy: { startsAt: "desc" } } },
  });
  if (!client) notFound();
  const tz = business.timezone;
  const spent = client.appointments.filter((a) => a.status === "COMPLETED").reduce((s, a) => s + a.priceAgorot, 0);

  return (
    <div className="space-y-4">
      <Link href="/dashboard/clients" className="muted">→ כל הלקוחות</Link>
      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <section className="card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="h1">{client.name}</h1>
              <p className="muted" dir="ltr">{client.phone}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className="btn-primary btn-sm" href={`/dashboard/appointments/new?clientId=${client.id}`}>קביעת תור</Link>
              <Link className="btn-secondary btn-sm" href={`/dashboard/invite?clientId=${client.id}`}>שליחת הזמנה</Link>
              <a className="btn-secondary btn-sm" target="_blank" rel="noreferrer" href={`https://wa.me/${whatsappNumber(client.phone)}`}>וואטסאפ</a>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div><dt className="muted">תורים</dt><dd className="font-medium">{client.appointments.length}</dd></div>
            <div><dt className="muted">סה״כ שולם (הושלמו)</dt><dd className="font-medium">{formatPrice(spent)}</dd></div>
            <div><dt className="muted">לקוחה מאז</dt><dd className="font-medium">{fmt(client.createdAt, tz, "d.M.yyyy")}</dd></div>
          </dl>
          <div>
            <h2 className="h2 mb-2">היסטוריית תורים</h2>
            {client.appointments.length === 0 ? (
              <p className="muted">אין תורים עדיין.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {client.appointments.map((a) => (
                  <li key={a.id}>
                    <Link href={`/dashboard/appointments/${a.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-stone-50">
                      <div>
                        <p className="text-sm font-medium">{a.serviceName}</p>
                        <p className="muted">{fmt(a.startsAt, tz, "EEE d.M.yy HH:mm")} · {formatPrice(a.priceAgorot)}</p>
                      </div>
                      <StatusBadge status={a.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
        <section className="card h-fit">
          <h2 className="h2 mb-3">פרטים</h2>
          <ClientForm client={{ id: client.id, name: client.name, phone: client.phone, email: client.email, notes: client.notes }} />
        </section>
      </div>
    </div>
  );
}
