import Link from "next/link";
import { db } from "@/lib/db";
import { requireBusiness } from "@/lib/session";
import { fmt } from "@/lib/time";
import { ClientForm } from "./ClientForm";

export const metadata = { title: "לקוחות" };

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const business = await requireBusiness();
  const q = ((await searchParams).q ?? "").trim();
  const clients = await db.client.findMany({
    where: {
      businessId: business.id,
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q.replace(/\D/g, "") || q } }] } : {}),
    },
    include: { appointments: { orderBy: { startsAt: "desc" }, take: 1, select: { startsAt: true } }, _count: { select: { appointments: true } } },
    orderBy: { name: "asc" },
    take: 200,
  });
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="h1">לקוחות</h1>
          <form className="flex gap-2">
            <input className="input w-48" name="q" defaultValue={q} placeholder="חיפוש שם או טלפון" />
            <button className="btn-secondary">חיפוש</button>
          </form>
        </div>
        {clients.length === 0 ? (
          <p className="mt-6 text-stone-600">{q ? "לא נמצאו לקוחות." : "עוד אין לקוחות. לקוחות שמזמינות דרך הדף נוספות לכאן אוטומטית."}</p>
        ) : (
          <ul className="mt-4 divide-y divide-stone-100">
            {clients.map((c) => (
              <li key={c.id}>
                <Link href={`/dashboard/clients/${c.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-stone-50">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="muted" dir="ltr">{c.phone}</p>
                  </div>
                  <div className="text-end text-xs text-stone-500">
                    <p>{c._count.appointments} תורים</p>
                    {c.appointments[0] && <p>אחרון: {fmt(c.appointments[0].startsAt, business.timezone, "d.M.yy")}</p>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="card h-fit">
        <h2 className="h2 mb-3">לקוחה חדשה</h2>
        <ClientForm />
      </section>
    </div>
  );
}
