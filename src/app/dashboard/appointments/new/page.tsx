import Link from "next/link";
import { db } from "@/lib/db";
import { requireBusiness } from "@/lib/session";
import { formatPrice } from "@/lib/money";
import { isDateKey, localDateKey } from "@/lib/time";
import { NewAppointmentForm } from "./NewAppointmentForm";

export const metadata = { title: "תור חדש" };

export default async function NewAppointmentPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const business = await requireBusiness();
  const sp = await searchParams;
  const [services, clients] = await Promise.all([
    db.service.findMany({ where: { businessId: business.id, active: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    db.client.findMany({ where: { businessId: business.id }, orderBy: { name: "asc" }, take: 500 }),
  ]);
  const date = isDateKey(sp.date) ? sp.date : localDateKey(new Date(), business.timezone);
  const time = /^\d{2}:\d{2}$/.test(sp.time ?? "") ? sp.time! : "10:00";

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href={`/dashboard?date=${date}`} className="muted">→ חזרה ליומן</Link>
      <h1 className="h1">תור חדש</h1>
      {services.length === 0 ? (
        <p className="card">קודם צריך להוסיף שירות. <Link className="font-medium text-brand-600 underline underline-offset-4" href="/dashboard/services">לשירותים</Link></p>
      ) : (
        <NewAppointmentForm
          services={services.map((s) => ({ id: s.id, name: s.name, durationMin: s.durationMin, price: formatPrice(s.priceAgorot) }))}
          clients={clients.map((c) => ({ id: c.id, name: c.name, phone: c.phone }))}
          date={date}
          time={time}
          clientId={sp.clientId}
        />
      )}
    </div>
  );
}
