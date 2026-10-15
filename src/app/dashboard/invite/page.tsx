import Link from "next/link";
import { db } from "@/lib/db";
import { requireBusiness } from "@/lib/session";
import { fmt } from "@/lib/time";
import { appUrl } from "@/lib/url";
import { inviteLink, inviteText } from "@/lib/invite";
import { whatsappNumber } from "@/lib/phone";
import { CopyButton } from "@/components/CopyButton";
import { NewInvitation } from "./NewInvitation";

export const metadata = { title: "הזמנות ללקוחות" };

const FILTERS = [
  { key: "all", label: "הכל" },
  { key: "pending", label: "ממתינות" },
  { key: "booked", label: "נקבע תור" },
  { key: "expired", label: "פג תוקף" },
] as const;
type Filter = (typeof FILTERS)[number]["key"];

export default async function InvitePage({ searchParams }: { searchParams: Promise<{ clientId?: string; status?: string }> }) {
  const business = await requireBusiness();
  const { clientId, status } = await searchParams;
  const filter: Filter = FILTERS.some((f) => f.key === status) ? (status as Filter) : "all";
  const now = new Date();
  const [services, client, invitations] = await Promise.all([
    db.service.findMany({ where: { businessId: business.id, active: true }, orderBy: { sortOrder: "asc" } }),
    clientId ? db.client.findFirst({ where: { id: clientId, businessId: business.id } }) : null,
    db.invitation.findMany({ where: { businessId: business.id }, include: { service: true }, orderBy: { createdAt: "desc" }, take: 300 }),
  ]);
  const bookingUrl = appUrl(`/b/${business.slug}`);

  const stateOf = (i: (typeof invitations)[number]): Exclude<Filter, "all"> => (i.usedAt ? "booked" : i.expiresAt < now ? "expired" : "pending");
  const counts = { all: invitations.length, pending: 0, booked: 0, expired: 0 };
  for (const i of invitations) counts[stateOf(i)]++;
  const shown = filter === "all" ? invitations : invitations.filter((i) => stateOf(i) === filter);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="h1">הזמנות</h1>
            <p className="muted mt-1">קישורים אישיים ששלחת ללקוחות לקביעת תור.</p>
          </div>
          <NewInvitation
            key={clientId ?? "new"}
            openOnLoad={Boolean(client)}
            services={services.map((s) => ({ id: s.id, name: s.name }))}
            defaults={{ clientName: client?.name ?? "", clientPhone: client?.phone ?? "" }}
          />
        </div>

        {invitations.length > 0 && (
          <nav className="-mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="סינון הזמנות">
            {FILTERS.map((f) => (
              <Link
                key={f.key}
                href={f.key === "all" ? "/dashboard/invite" : `/dashboard/invite?status=${f.key}`}
                scroll={false}
                className={`badge shrink-0 whitespace-nowrap px-3 py-1 ${filter === f.key ? "bg-stone-900 text-ivory" : "border border-stone-300 text-stone-700 hover:border-stone-900"}`}
              >
                {f.label} · {counts[f.key]}
              </Link>
            ))}
          </nav>
        )}

        {invitations.length === 0 ? (
          <p className="mt-6 text-stone-600">עוד לא שלחת הזמנות. לחצי על &quot;הזמנה חדשה&quot; כדי ליצור קישור אישי ללקוחה.</p>
        ) : shown.length === 0 ? (
          <p className="mt-6 text-stone-600">אין הזמנות בסטטוס הזה.</p>
        ) : (
          <ul className="mt-4 divide-y divide-stone-100">
            {shown.map((i) => {
              const state = stateOf(i);
              const link = inviteLink(business.slug, i.token);
              const text = inviteText({ link, businessName: business.name, clientName: i.clientName, serviceName: i.service?.name, message: i.message });
              const wa = i.clientPhone
                ? `https://wa.me/${whatsappNumber(i.clientPhone)}?text=${encodeURIComponent(text)}`
                : `https://wa.me/?text=${encodeURIComponent(text)}`;
              return (
                <li key={i.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{i.clientName || "ללא שם"}</p>
                      <span className={`badge ${state === "booked" ? "bg-stone-900 text-ivory" : state === "expired" ? "bg-stone-200 text-stone-600" : "border border-stone-900 text-stone-900"}`}>
                        {state === "booked" ? "נקבע תור" : state === "expired" ? "פג תוקף" : "ממתינה"}
                      </span>
                    </div>
                    <p className="muted mt-0.5">
                      {i.clientPhone && <span dir="ltr">{i.clientPhone}</span>}
                      {i.clientPhone && " · "}
                      {i.service ? i.service.name : "הלקוחה בוחרת שירות"}
                    </p>
                    <p className="mt-0.5 text-xs text-stone-500">
                      נשלחה {fmt(i.createdAt, business.timezone, "d.M.yy")}
                      {" · "}
                      {state === "booked" && i.usedAt
                        ? `נקבע ב-${fmt(i.usedAt, business.timezone, "d.M.yy")}`
                        : state === "expired"
                          ? `פג ב-${fmt(i.expiresAt, business.timezone, "d.M.yy")}`
                          : `בתוקף עד ${fmt(i.expiresAt, business.timezone, "d.M.yy")}`}
                    </p>
                  </div>
                  {state === "pending" && (
                    <div className="flex shrink-0 gap-2">
                      <a className="btn-secondary btn-sm" href={wa} target="_blank" rel="noreferrer">שליחה שוב</a>
                      <CopyButton text={link} className="btn-ghost btn-sm" />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card h-fit">
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
    </div>
  );
}
