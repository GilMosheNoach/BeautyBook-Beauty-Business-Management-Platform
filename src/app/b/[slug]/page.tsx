import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { BookingFlow } from "./BookingFlow";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ invite?: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const business = await db.business.findUnique({ where: { slug } });
  if (!business) return {};
  return { title: `קביעת תור · ${business.name}`, description: business.about || `קביעת תור אונליין ב${business.name}` };
}

export default async function BusinessPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { invite: inviteToken } = await searchParams;
  const business = await db.business.findUnique({
    where: { slug },
    include: { services: { where: { active: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
  });
  if (!business) notFound();

  const invitation = inviteToken
    ? await db.invitation.findFirst({ where: { token: inviteToken, businessId: business.id, usedAt: null, expiresAt: { gt: new Date() } } })
    : null;
  const initials = business.name.trim().slice(0, 1);

  return (
    <main className="mx-auto min-h-dvh max-w-xl px-4 pb-16">
      <header className="pt-8 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-3xl font-bold text-white shadow-lg">
          {initials}
        </div>
        <h1 className="mt-4 text-2xl font-extrabold">{business.name}</h1>
        {business.about && <p className="mx-auto mt-2 max-w-md whitespace-pre-line text-stone-600">{business.about}</p>}
        <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-stone-500">
          {business.address && <span>📍 {business.address}</span>}
          {business.phone && <a href={`tel:${business.phone}`} dir="ltr">📞 {business.phone}</a>}
          {business.instagram && (
            <a href={`https://instagram.com/${business.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer">📸 {business.instagram}</a>
          )}
        </div>
      </header>

      {invitation && (
        <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-center">
          <p className="font-semibold text-brand-800">{invitation.clientName ? `היי ${invitation.clientName}! ` : ""}קיבלת הזמנה אישית 💌</p>
          {invitation.message && <p className="mt-1 text-sm text-brand-900">{invitation.message}</p>}
        </div>
      )}
      {inviteToken && !invitation && (
        <p className="mt-6 rounded-xl bg-stone-100 p-3 text-center text-sm text-stone-600">קישור ההזמנה כבר נוצל או שפג תוקפו, אבל עדיין אפשר לקבוע תור כאן.</p>
      )}

      <div className="mt-6">
        <BookingFlow
          slug={business.slug}
          timezone={business.timezone}
          requiresApproval={business.bookingMode === "APPROVAL"}
          services={business.services.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            durationMin: s.durationMin,
            priceLabel: formatPrice(s.priceAgorot),
          }))}
          invite={
            invitation
              ? { token: invitation.token, clientName: invitation.clientName, clientPhone: invitation.clientPhone, serviceId: invitation.serviceId }
              : null
          }
        />
      </div>
      <p className="mt-10 text-center text-xs text-stone-400">מופעל על ידי BeautyBook</p>
    </main>
  );
}
