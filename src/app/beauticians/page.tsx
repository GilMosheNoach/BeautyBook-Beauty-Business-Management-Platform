import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { JsonLd } from "@/components/JsonLd";
import { PinIcon } from "@/components/Icons";
import { db } from "@/lib/db";
import { appUrl, businessUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

const TITLE = "קוסמטיקאיות · קביעת תור אונליין";
const DESCRIPTION = "קוסמטיקאיות ועסקי יופי שאפשר לקבוע אצלן תור אונליין: טיפולי פנים, גבות, ריסים, הסרת שיער ועוד. בוחרים טיפול ושעה פנויה, בלי הרשמה.";

export const metadata: Metadata = {
  title: { absolute: `${TITLE} | BeautyBook` },
  description: DESCRIPTION,
  alternates: { canonical: appUrl("/beauticians") },
  openGraph: { title: TITLE, description: DESCRIPTION, url: appUrl("/beauticians") },
};

export default async function BeauticiansPage() {
  const businesses = await db.business.findMany({
    where: { onboarded: true },
    orderBy: { createdAt: "asc" },
    select: { slug: true, name: true, tagline: true, address: true, services: { where: { active: true }, select: { name: true }, take: 4, orderBy: { sortOrder: "asc" } } },
  });

  return (
    <div className="min-h-dvh bg-stone-50">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: TITLE,
          itemListElement: businesses.map((b, i) => ({ "@type": "ListItem", position: i + 1, url: businessUrl(b.slug), name: b.name })),
        }}
      />
      <header className="mx-auto flex max-w-5xl items-center justify-between border-b border-stone-200 px-4 py-5">
        <Logo />
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-20">
        <section className="py-14 text-center sm:py-20">
          <p className="eyebrow">קביעת תור אונליין</p>
          <h1 className="mt-4 font-serif text-4xl font-light sm:text-6xl">קוסמטיקאיות</h1>
          <p className="mx-auto mt-4 max-w-xl text-stone-600">{DESCRIPTION}</p>
        </section>
        {businesses.length === 0 ? (
          <p className="text-center text-stone-500">עוד אין כאן עסקים.</p>
        ) : (
          <ul className="grid gap-px border border-stone-200 bg-stone-200 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((b) => (
              <li key={b.slug} className="bg-stone-50">
                <a href={businessUrl(b.slug)} className="block h-full p-7 hover:bg-ivory">
                  <h2 className="font-serif text-2xl font-light">{b.name}</h2>
                  {b.tagline && <p className="mt-2 text-sm text-stone-600">{b.tagline}</p>}
                  {b.address && (
                    <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-stone-600"><PinIcon size={14} />{b.address}</p>
                  )}
                  {b.services.length > 0 && <p className="mt-3 text-xs text-stone-500">{b.services.map((s) => s.name).join(" · ")}</p>}
                  <p className="mt-5 inline-block border-b border-current pb-0.5 text-xs tracking-[0.2em]">לקביעת תור</p>
                </a>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
