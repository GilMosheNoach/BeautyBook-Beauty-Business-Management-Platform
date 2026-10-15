import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { ChevronRightIcon } from "@/components/Icons";
import { BookingFlow } from "../BookingFlow";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ invite?: string; service?: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const business = await db.business.findUnique({ where: { slug }, select: { name: true } });
  return business ? { title: `קביעת תור · ${business.name}` } : {};
}

/** The booking steps on their own page, reached from a treatment card or a "book" button on the landing page. */
export default async function BookPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { invite: inviteToken, service: serviceParam } = await searchParams;
  const business = await db.business.findUnique({
    where: { slug },
    include: { services: { where: { active: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
  });
  if (!business) notFound();

  const invitation = inviteToken
    ? await db.invitation.findFirst({ where: { token: inviteToken, businessId: business.id, usedAt: null, expiresAt: { gt: new Date() } } })
    : null;
  const services = business.services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    durationMin: s.durationMin,
    priceLabel: formatPrice(s.priceAgorot),
  }));
  const initialServiceId = services.find((s) => s.id === serviceParam)?.id ?? invitation?.serviceId ?? null;
  const back = `/b/${business.slug}${invitation ? `?invite=${invitation.token}` : ""}`;

  return (
    <main className="min-h-dvh bg-stone-50">
      <header className="bg-stone-900 text-ivory">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-10">
          <Link href={back} className="inline-flex items-center gap-1 text-sm text-ivory/85 hover:text-ivory">
            <ChevronRightIcon size={16} /> חזרה
          </Link>
          <Link href={back} className="truncate font-serif text-lg tracking-[0.2em]">{business.name}</Link>
        </nav>
        <div className="mx-auto max-w-xl px-6 pb-12 pt-8 text-center">
          <p className="text-xs tracking-[0.3em] text-ivory/70">קביעת תור</p>
          <h1 className="mt-3 font-serif text-4xl font-light sm:text-5xl">בחרי טיפול ומועד</h1>
          {invitation && (
            <p className="mt-4 text-sm text-ivory/80">{invitation.clientName ? `${invitation.clientName}, ` : ""}קיבלת הזמנה אישית</p>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-xl px-4 py-12">
        <BookingFlow
          slug={business.slug}
          timezone={business.timezone}
          requiresApproval={business.bookingMode === "APPROVAL"}
          services={services}
          initialServiceId={initialServiceId}
          invite={invitation ? { token: invitation.token, clientName: invitation.clientName, clientPhone: invitation.clientPhone } : null}
        />
      </section>
    </main>
  );
}
