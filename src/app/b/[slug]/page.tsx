import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { imageUrl, pageImages } from "@/server/images";
import { Wordmark } from "@/components/Logo";
import { InstagramIcon, PhoneIcon, PinIcon } from "@/components/Icons";
import { BookingFlow } from "./BookingFlow";
import { Gallery } from "./Gallery";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ invite?: string; service?: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const business = await db.business.findUnique({ where: { slug } });
  if (!business) return {};
  const cover = await db.image.findFirst({ where: { businessId: business.id, kind: "COVER" }, select: { id: true } });
  return {
    title: `קביעת תור · ${business.name}`,
    description: business.tagline || business.about || `קביעת תור אונליין ב${business.name}`,
    openGraph: cover ? { images: [imageUrl(cover.id)] } : undefined,
  };
}

export default async function BusinessPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { invite: inviteToken, service: serviceParam } = await searchParams;
  const business = await db.business.findUnique({
    where: { slug },
    include: { services: { where: { active: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
  });
  if (!business) notFound();

  const [invitation, images] = await Promise.all([
    inviteToken
      ? db.invitation.findFirst({ where: { token: inviteToken, businessId: business.id, usedAt: null, expiresAt: { gt: new Date() } } })
      : null,
    pageImages(business.id),
  ]);
  const services = business.services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    durationMin: s.durationMin,
    priceLabel: formatPrice(s.priceAgorot),
    imageId: images.byService.get(s.id) ?? null,
  }));
  const showTiles = services.some((s) => s.imageId);
  const initialServiceId = invitation?.serviceId ?? services.find((s) => s.id === serviceParam)?.id ?? null;
  const instagram = business.instagram.replace(/^@/, "");

  return (
    <main className="min-h-dvh bg-stone-50">
      {/* Hero: the owner's cover photo, or a quiet espresso band until she uploads one */}
      <header className={`relative flex flex-col bg-stone-900 text-ivory ${images.coverId ? "min-h-[78svh] sm:min-h-[640px]" : "min-h-[56svh] sm:min-h-[480px]"}`}>
        {images.coverId && (
          <>
            <Image src={imageUrl(images.coverId)} alt="" fill priority sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/30 to-stone-950/20" />
          </>
        )}
        <div className="relative border-b border-ivory/20 py-4 text-center font-serif text-sm tracking-[0.35em]">{business.name}</div>
        <div className="relative mx-auto mt-auto w-full max-w-5xl px-6 pb-14 pt-24 sm:pb-20">
          {business.address && <p className="text-xs tracking-[0.3em] text-ivory/80">{business.address}</p>}
          <h1 className="mt-3 max-w-3xl font-serif text-5xl font-light leading-[1.05] sm:text-7xl">{business.name}</h1>
          {business.tagline && <p className="mt-4 max-w-xl text-lg font-light leading-relaxed text-ivory/90">{business.tagline}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#book" className="btn bg-ivory px-7 py-3 text-stone-900 hover:bg-white">לקביעת תור</a>
            {business.phone && (
              <a href={`tel:${business.phone}`} className="btn border border-ivory/70 px-6 py-3 text-ivory hover:bg-ivory hover:text-stone-900" dir="ltr">
                {business.phone}
              </a>
            )}
          </div>
        </div>
      </header>

      {invitation && (
        <div className="border-b border-stone-200 bg-nude/50 px-6 py-5 text-center">
          <p className="font-serif text-lg">{invitation.clientName ? `${invitation.clientName}, ` : ""}קיבלת הזמנה אישית</p>
          {invitation.message && <p className="mt-1 text-sm text-stone-700">{invitation.message}</p>}
        </div>
      )}
      {inviteToken && !invitation && (
        <p className="border-b border-stone-200 bg-stone-100 px-6 py-4 text-center text-sm text-stone-600">
          קישור ההזמנה כבר נוצל או שפג תוקפו, אבל עדיין אפשר לקבוע תור כאן.
        </p>
      )}

      {business.about && (
        <section className="mx-auto max-w-2xl px-6 py-20 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-stone-900/70 font-serif text-3xl font-light">
            {business.name.trim().slice(0, 1)}
          </div>
          <p className="mt-8 whitespace-pre-line font-serif text-xl font-light leading-relaxed sm:text-2xl">{business.about}</p>
        </section>
      )}

      {showTiles && (
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <SectionTitle eyebrow="הטיפולים שלנו" title="טיפולים" />
          <div className={`mt-8 grid gap-3 ${tileColumns(services.length)}`}>
            {services.map((s) => (
              <a key={s.id} href={`?service=${s.id}#book`} className="group relative block aspect-[4/3] overflow-hidden bg-sand sm:aspect-[4/5]">
                {s.imageId && (
                  <Image src={imageUrl(s.imageId)} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
                )}
                <div className={`absolute inset-0 ${s.imageId ? "bg-gradient-to-t from-stone-950/75 via-stone-950/10 to-transparent" : ""}`} />
                <div className={`absolute inset-x-0 bottom-0 p-6 ${s.imageId ? "text-ivory" : "text-stone-900"}`}>
                  <p className="font-serif text-2xl font-light">{s.name}</p>
                  <p className="mt-1 text-sm opacity-85">{s.durationMin} דקות · {s.priceLabel}</p>
                  <p className="mt-3 inline-block border-b border-current pb-0.5 text-xs tracking-[0.2em]">לקביעת תור</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {images.gallery.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <SectionTitle eyebrow="מהסטודיו" title="גלריה" />
          <Gallery ids={images.gallery} />
        </section>
      )}

      <section id="book" className="scroll-mt-4 border-t border-stone-200 bg-ivory py-16">
        <div className="mx-auto max-w-xl px-4">
          <SectionTitle eyebrow="קביעת תור" title="בחרי טיפול ומועד" />
          <div className="mt-10">
            <BookingFlow
              slug={business.slug}
              timezone={business.timezone}
              requiresApproval={business.bookingMode === "APPROVAL"}
              services={services}
              initialServiceId={initialServiceId}
              invite={
                invitation
                  ? { token: invitation.token, clientName: invitation.clientName, clientPhone: invitation.clientPhone }
                  : null
              }
            />
          </div>
        </div>
      </section>

      <footer className="bg-stone-900 px-6 py-14 text-center text-ivory">
        <p className="font-serif text-2xl font-light">{business.name}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-ivory/80">
          {business.address && <span className="inline-flex items-center gap-2"><PinIcon size={16} />{business.address}</span>}
          {business.phone && (
            <a href={`tel:${business.phone}`} className="inline-flex items-center gap-2 hover:text-ivory"><PhoneIcon size={16} /><span dir="ltr">{business.phone}</span></a>
          )}
          {instagram && (
            <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-ivory">
              <InstagramIcon size={16} /><span dir="ltr">@{instagram}</span>
            </a>
          )}
        </div>
        <p className="mt-10 flex items-baseline justify-center gap-2 text-xs text-ivory/60">
          מופעל על ידי <Wordmark className="text-base text-ivory/90" />
        </p>
      </footer>
    </main>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-2 font-serif text-3xl font-light sm:text-4xl">{title}</h2>
    </div>
  );
}

/** Picks a column count that leaves no lonely tile in the last row where possible. */
function tileColumns(count: number) {
  if (count === 1) return "mx-auto max-w-md";
  if (count === 2) return "sm:grid-cols-2";
  if (count % 4 === 0) return "sm:grid-cols-2 lg:grid-cols-4";
  return "sm:grid-cols-2 lg:grid-cols-3";
}
