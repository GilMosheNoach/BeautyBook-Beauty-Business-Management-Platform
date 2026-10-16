import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { imageUrl, pageImages } from "@/server/images";
import { LogoMark, Wordmark } from "@/components/Logo";
import { InstagramIcon, PhoneIcon, PinIcon } from "@/components/Icons";
import { JsonLd } from "@/components/JsonLd";
import { LegalLinks } from "@/components/LegalFooter";
import { SITE_NAME, businessDescription, businessJsonLd } from "@/lib/seo";
import { businessUrl } from "@/lib/url";
import { businessPath } from "@/server/businessPath";
import { Gallery } from "./Gallery";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ invite?: string; service?: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const business = await db.business.findUnique({
    where: { slug },
    include: { services: { where: { active: true }, select: { name: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
  });
  if (!business) return {};
  const cover = await db.image.findFirst({ where: { businessId: business.id, kind: "COVER" }, select: { id: true } });
  // Her name first, then what she is: people search for the name, or for "קוסמטיקאית" plus a place.
  const title = `${business.name} · קוסמטיקאית · קביעת תור אונליין`;
  const description = businessDescription(business, business.services.map((s) => s.name));
  const url = businessUrl(business.slug);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "he_IL",
      siteName: SITE_NAME,
      url,
      title: business.name,
      description,
      images: cover ? [imageUrl(cover.id)] : undefined,
    },
    twitter: { card: cover ? "summary_large_image" : "summary", title: business.name, description },
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

  const [invitation, images, hours] = await Promise.all([
    inviteToken
      ? db.invitation.findFirst({ where: { token: inviteToken, businessId: business.id, usedAt: null, expiresAt: { gt: new Date() } } })
      : null,
    pageImages(business.id),
    db.workingHours.findMany({ where: { businessId: business.id }, orderBy: [{ weekday: "asc" }, { startMin: "asc" }] }),
  ]);
  const services = business.services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    durationMin: s.durationMin,
    priceLabel: formatPrice(s.priceAgorot),
    imageId: images.byService.get(s.id) ?? null,
  }));
  // Booking lives on its own page; a valid invitation rides along so the client's details are filled in there.
  const bookBase = await businessPath(business.slug, "/book");
  const bookHref = (serviceId?: string) => {
    const q = new URLSearchParams();
    if (serviceId) q.set("service", serviceId);
    else if (serviceParam) q.set("service", serviceParam);
    if (invitation) q.set("invite", invitation.token);
    const qs = q.toString();
    return `${bookBase}${qs ? `?${qs}` : ""}`;
  };
  const instagram = business.instagram.replace(/^@/, "");

  const initial = business.name.trim().slice(0, 1);

  return (
    <main className="min-h-dvh bg-stone-50">
      <JsonLd
        data={businessJsonLd(
          business,
          business.services,
          hours,
          [images.coverId, ...images.gallery.slice(0, 5)].filter((id): id is string => Boolean(id)).map(imageUrl),
        )}
      />
      {/* Hero: the owner's cover photo full-bleed, or an espresso field with her monogram until she uploads one */}
      <header className="relative flex h-[calc(100svh+2.5rem)] min-h-[600px] flex-col overflow-hidden bg-stone-900 text-ivory">
        {images.coverId ? (
          <>
            <Image src={imageUrl(images.coverId)} alt="" fill priority sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/25 to-stone-950/40" />
          </>
        ) : (
          <div aria-hidden className="pointer-events-none absolute -bottom-24 end-[-4rem] select-none font-serif text-[28rem] font-extralight leading-none text-ivory/[0.04] sm:text-[40rem]">
            {initial}
          </div>
        )}

        <nav className="relative z-10 flex items-center justify-between gap-4 border-b border-ivory/15 px-5 py-4 sm:px-10">
          <a href="#top" className="truncate font-serif font-light text-lg tracking-[0.2em]">{business.name}</a>
          <div className="flex shrink-0 items-center gap-6 text-sm tracking-wide">
            {services.length > 0 && <a href="#services" className="hidden text-ivory/85 hover:text-ivory sm:inline">טיפולים</a>}
            <a href="#gallery" className="hidden text-ivory/85 hover:text-ivory sm:inline">גלריה</a>
            <a href={services.length ? "#services" : bookHref()} className="border border-ivory/70 px-4 py-2 text-xs tracking-[0.15em] hover:bg-ivory hover:text-stone-900">לקביעת תור</a>
          </div>
        </nav>

        <div id="top" className="relative mx-auto my-auto w-full max-w-6xl px-6 pb-10 sm:px-10">
          {business.address && <p className="text-xs tracking-[0.3em] text-ivory/80">{business.address}</p>}
          <h1 className="mt-4 max-w-4xl font-serif text-[3.25rem] font-extralight leading-[1.02] sm:text-8xl">{business.name}</h1>
          {business.tagline && <p className="mt-5 max-w-xl text-lg font-light leading-relaxed text-ivory/90 sm:text-xl">{business.tagline}</p>}
          <div className="mt-9 flex flex-wrap gap-3">
            <a href={services.length ? "#services" : bookHref()} className="btn bg-ivory px-8 py-3.5 tracking-[0.12em] text-stone-900 hover:bg-white">לקביעת תור</a>
            {services.length > 0 && (
              <a href="#services" className="btn border border-ivory/70 px-8 py-3.5 tracking-[0.12em] text-ivory hover:bg-ivory hover:text-stone-900">לטיפולים</a>
            )}
          </div>
        </div>
      </header>

      {/* Intro panel rises over the hero */}
      <section className="relative z-10 -mt-10 rounded-t-[2.5rem] bg-stone-50 px-6 pb-4 pt-14 text-center sm:pt-16">
        {invitation && (
          <div className="mx-auto mb-10 max-w-xl border border-stone-300 bg-ivory px-6 py-5">
            <p className="font-serif font-light text-lg">{invitation.clientName ? `${invitation.clientName}, ` : ""}קיבלת הזמנה אישית</p>
            {invitation.message && <p className="mt-1 text-sm text-stone-700">{invitation.message}</p>}
          </div>
        )}
        {inviteToken && !invitation && (
          <p className="mx-auto mb-10 max-w-xl bg-stone-100 px-6 py-4 text-sm text-stone-600">
            קישור ההזמנה כבר נוצל או שפג תוקפו, אבל עדיין אפשר לקבוע תור כאן.
          </p>
        )}
        {business.about && (
          <p className="mx-auto max-w-2xl whitespace-pre-line font-serif text-2xl font-extralight leading-relaxed sm:text-[1.75rem]">{business.about}</p>
        )}
      </section>

      {services.length > 0 && (
        <section id="services" className="scroll-mt-6 pt-16 pb-20 sm:pt-20 sm:pb-24">
          <SectionTitle title="טיפולים" />
          {/* Full-bleed tiles, edge to edge: stacked on phones, side by side on wider screens */}
          <div className={`group/grid mt-10 grid grid-cols-1 gap-1 ${tileColumns(services.length)}`}>
            {services.map((s, i) => (
              <ServiceCard key={s.id} service={s} index={i} href={bookHref(s.id)} shape={tileShape(services.length)} />
            ))}
          </div>
        </section>
      )}

      <section id="gallery" className="mx-auto max-w-6xl scroll-mt-6 px-4 pb-20 sm:px-6">
        <SectionTitle title="גלריה" />
        {images.gallery.length > 0 ? (
          <Gallery ids={images.gallery} />
        ) : (
          // Empty frames hold the gallery's place until the owner uploads photos.
          <div aria-hidden className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
            {EMPTY_FILLS.concat(EMPTY_FILLS).map((fill, i) => (
              <div key={i} className={`aspect-square ${fill}`} />
            ))}
          </div>
        )}
      </section>

      {(business.bio || images.aboutId) && (
        <section id="about" className="scroll-mt-6 bg-ivory">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 sm:grid-cols-2 sm:gap-16 sm:px-10 sm:py-28">
            <div className={images.aboutId ? "" : "sm:col-span-2 sm:mx-auto sm:max-w-2xl sm:text-center"}>
              <p className="eyebrow">קצת עליי</p>
              <h2 className="mt-3 font-serif text-4xl font-extralight leading-tight sm:text-5xl">{business.bioTitle || business.name}</h2>
              {business.bio && <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-stone-700 sm:text-lg">{business.bio}</p>}
              <a href={services.length ? "#services" : bookHref()} className="btn-primary mt-9 px-8 py-3.5 tracking-[0.12em]">לקביעת תור</a>
            </div>
            {images.aboutId && (
              <div className="relative order-first aspect-[4/5] overflow-hidden bg-sand sm:order-none">
                <Image src={imageUrl(images.aboutId)} alt={business.bioTitle || business.name} fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
              </div>
            )}
          </div>
        </section>
      )}

      <footer className="bg-stone-900 px-6 py-14 text-center text-ivory">
        <p className="font-serif text-2xl font-extralight">{business.name}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-ivory/80">
          {business.address && <span className="inline-flex items-center gap-2"><PinIcon size={16} />{business.address}</span>}
          {business.phone && (
            <a href={`tel:${business.phone}`} className="inline-flex items-center gap-2 hover:text-ivory"><PhoneIcon size={16} /><span dir="ltr">{business.phone}</span></a>
          )}
          {instagram && (
            <a href={`https://instagram.com/${encodeURIComponent(instagram)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-ivory">
              <InstagramIcon size={16} /><span dir="ltr">@{instagram}</span>
            </a>
          )}
        </div>
        <p className="mt-10 flex items-center justify-center gap-2 text-xs text-ivory/60">
          מופעל על ידי <span dir="ltr" className="inline-flex items-center gap-1.5"><LogoMark size={18} /><Wordmark className="text-base text-ivory/90" /></span>
        </p>
        <LegalLinks className="mt-4 text-ivory/60 [&_a:hover]:text-ivory" />
      </footer>
    </main>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="text-center font-serif text-3xl font-extralight sm:text-4xl">{title}</h2>;
}

/** Picks a column count that leaves no lonely card in the last row where possible. */
function tileColumns(count: number) {
  if (count === 1) return "";
  if (count === 2) return "sm:grid-cols-2";
  if (count === 3) return "sm:grid-cols-3";
  if (count % 4 === 0) return "sm:grid-cols-2 lg:grid-cols-4";
  return "sm:grid-cols-2 lg:grid-cols-3";
}

/** Tall portrait tiles, flattened when there are only one or two so they don't tower over the screen. */
function tileShape(count: number) {
  if (count === 1) return "aspect-[4/5] sm:aspect-[21/9]";
  if (count === 2) return "aspect-[4/5] sm:aspect-[5/4]";
  return "aspect-[4/5] sm:aspect-[3/4]";
}

type ServiceCardData = { id: string; name: string; description: string; durationMin: number; priceLabel: string; imageId: string | null };

// Soft fills for cards whose owner hasn't added a photo yet.
const EMPTY_FILLS = ["bg-sand", "bg-nude", "bg-stone-200"];

function ServiceCard({ service: s, index, href, shape }: { service: ServiceCardData; index: number; href: string; shape: string }) {
  const photo = Boolean(s.imageId);
  return (
    <a
      href={href}
      className={`group relative block overflow-hidden outline-none transition-opacity duration-500 sm:group-hover/grid:opacity-50 sm:hover:!opacity-100 ${shape} ${photo ? "bg-stone-900" : EMPTY_FILLS[index % EMPTY_FILLS.length]}`}
    >
      {s.imageId ? (
        <>
          <Image src={imageUrl(s.imageId)} alt="" fill sizes="(min-width: 1024px) 34vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/10 to-transparent" />
        </>
      ) : (
        <span aria-hidden className="absolute start-6 top-5 font-display text-7xl lining-nums text-stone-900/15">
          {String(index + 1).padStart(2, "0")}
        </span>
      )}
      {/* Hover: the other tiles fade back */}
      <div className={`absolute inset-x-0 bottom-0 p-7 transition-transform duration-500 group-hover:-translate-y-1 sm:p-8 ${photo ? "text-ivory" : "text-stone-900"}`}>
        <p className="font-serif text-[2rem] font-extralight leading-tight sm:text-[2.25rem]">{s.name}</p>
        {s.description && <p className="mt-2 line-clamp-2 text-sm leading-relaxed opacity-85">{s.description}</p>}
        <p className="mt-2 text-sm opacity-85">{s.durationMin} דקות · {s.priceLabel}</p>
        <p className={`mt-4 inline-block border px-4 py-2 text-xs tracking-[0.2em] transition duration-500 border-current ${photo ? "group-hover:bg-ivory group-hover:text-stone-900" : "group-hover:bg-stone-900 group-hover:text-ivory"}`}>לקביעת תור</p>
      </div>
    </a>
  );
}
