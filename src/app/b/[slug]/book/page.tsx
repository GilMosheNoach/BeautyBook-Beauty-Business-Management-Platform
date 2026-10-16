import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { ChevronRightIcon } from "@/components/Icons";
import { LegalFooter } from "@/components/LegalFooter";
import { businessUrl } from "@/lib/url";
import { businessPath } from "@/server/businessPath";
import { imageUrl } from "@/server/images";
import { BookingFlow } from "../BookingFlow";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ invite?: string; service?: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const business = await db.business.findUnique({ where: { slug }, select: { name: true, slug: true } });
  return business ? { title: `קביעת תור · ${business.name}`, alternates: { canonical: businessUrl(business.slug, "/book") } } : {};
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
  const back = `${await businessPath(business.slug)}${invitation ? `?invite=${invitation.token}` : ""}`;
  // Chosen on the landing page (or carried by the invitation): show it as the page's hero and go straight to the date.
  const chosen = services.find((s) => s.id === initialServiceId) ?? null;
  const chosenImage = chosen
    ? await db.image.findFirst({ where: { businessId: business.id, kind: "SERVICE", serviceId: chosen.id }, select: { id: true } })
    : null;

  return (
    <main className="min-h-dvh bg-stone-50">
      <header className={`relative flex flex-col overflow-hidden bg-stone-900 text-ivory ${chosen ? "min-h-[62svh]" : ""}`}>
        {chosenImage && (
          <>
            <Image src={imageUrl(chosenImage.id)} alt="" fill priority sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/35 to-stone-950/50" />
          </>
        )}
        <nav className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-10">
          <Link href={back} className="inline-flex items-center gap-1 text-sm text-ivory/85 hover:text-ivory">
            <ChevronRightIcon size={16} /> חזרה
          </Link>
          <Link href={back} className="truncate font-serif font-light text-lg tracking-[0.2em]">{business.name}</Link>
        </nav>
        {chosen ? (
          <div className="relative mx-auto mt-auto w-full max-w-xl px-6 pb-12 pt-16 text-center">
            <p className="text-xs tracking-[0.3em] text-ivory/75">הטיפול שבחרת</p>
            <h1 className="mt-4 font-serif text-5xl font-extralight leading-tight sm:text-6xl">{chosen.name}</h1>
            {chosen.description && <p className="mx-auto mt-4 max-w-md text-base font-light leading-relaxed text-ivory/85">{chosen.description}</p>}
            <p className="mt-5 text-sm tracking-[0.15em] text-ivory/90">{chosen.durationMin} דקות · {chosen.priceLabel}</p>
            {invitation && (
              <p className="mt-4 text-sm text-ivory/80">{invitation.clientName ? `${invitation.clientName}, ` : ""}קיבלת הזמנה אישית</p>
            )}
            <Link href={`${back}#services`} className="mt-7 inline-block border-b border-ivory/60 pb-0.5 text-xs tracking-[0.2em] text-ivory/85 hover:text-ivory">
              שינוי טיפול
            </Link>
          </div>
        ) : (
          <div className="relative mx-auto max-w-xl px-6 pb-12 pt-8 text-center">
            <p className="text-xs tracking-[0.3em] text-ivory/70">קביעת תור</p>
            <h1 className="mt-3 font-serif text-4xl font-extralight sm:text-5xl">בחרי טיפול ומועד</h1>
            {invitation && (
              <p className="mt-4 text-sm text-ivory/80">{invitation.clientName ? `${invitation.clientName}, ` : ""}קיבלת הזמנה אישית</p>
            )}
          </div>
        )}
      </header>

      <section className="mx-auto max-w-xl px-4 py-12">
        <BookingFlow
          slug={business.slug}
          timezone={business.timezone}
          requiresApproval={business.bookingMode === "APPROVAL"}
          services={services}
          initialServiceId={initialServiceId}
          fixedService={Boolean(chosen)}
          invite={invitation ? { token: invitation.token, clientName: invitation.clientName, clientPhone: invitation.clientPhone } : null}
        />
      </section>
      <LegalFooter />
    </main>
  );
}
