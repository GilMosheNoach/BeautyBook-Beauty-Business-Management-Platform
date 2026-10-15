import { db } from "@/lib/db";
import { requireBusiness } from "@/lib/session";
import { fmt } from "@/lib/time";
import { appUrl } from "@/lib/url";
import { CopyButton } from "@/components/CopyButton";
import { InviteForm } from "./InviteForm";

export const metadata = { title: "הזמנות ללקוחות" };

export default async function InvitePage({ searchParams }: { searchParams: Promise<{ clientId?: string }> }) {
  const business = await requireBusiness();
  const { clientId } = await searchParams;
  const [services, client, invitations] = await Promise.all([
    db.service.findMany({ where: { businessId: business.id, active: true }, orderBy: { sortOrder: "asc" } }),
    clientId ? db.client.findFirst({ where: { id: clientId, businessId: business.id } }) : null,
    db.invitation.findMany({ where: { businessId: business.id }, include: { service: true }, orderBy: { createdAt: "desc" }, take: 15 }),
  ]);
  const bookingUrl = appUrl(`/b/${business.slug}`);
  const now = new Date();

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_24rem]">
      <section className="card">
        <h1 className="h1">שליחת הזמנה ללקוחה</h1>
        <p className="muted mb-4 mt-1">יוצרים קישור אישי עם השם של הלקוחה ושולחים לה בוואטסאפ או SMS. היא בוחרת מועד בעצמה.</p>
        <InviteForm
          key={clientId ?? "new"}
          services={services.map((s) => ({ id: s.id, name: s.name }))}
          defaults={{ clientName: client?.name ?? "", clientPhone: client?.phone ?? "" }}
        />
      </section>
      <div className="space-y-5">
        <section className="card">
          <h2 className="h2">הקישור הכללי שלך</h2>
          <p className="muted mt-1">לשיתוף בסטורי, בביו או בקבוצות.</p>
          <code className="mt-3 block break-all rounded-lg bg-stone-50 px-3 py-2 text-sm" dir="ltr">{bookingUrl}</code>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyButton text={bookingUrl} />
            <a className="btn-secondary" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`לקביעת תור ב${business.name}: ${bookingUrl}`)}`}>
              שיתוף בוואטסאפ
            </a>
          </div>
        </section>
        {invitations.length > 0 && (
          <section className="card">
            <h2 className="h2 mb-2">הזמנות אחרונות</h2>
            <ul className="divide-y divide-stone-100 text-sm">
              {invitations.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-2 py-2">
                  <div>
                    <p className="font-medium">{i.clientName || "ללא שם"}{i.service ? ` · ${i.service.name}` : ""}</p>
                    <p className="muted">{fmt(i.createdAt, business.timezone, "d.M HH:mm")}</p>
                  </div>
                  <span className={`badge ${i.usedAt ? "bg-stone-900 text-ivory" : i.expiresAt < now ? "bg-stone-200 text-stone-600" : "border border-stone-900 text-stone-900"}`}>
                    {i.usedAt ? "נקבע תור" : i.expiresAt < now ? "פג תוקף" : "נשלחה"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
