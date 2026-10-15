import type { Business, Service, WorkingHours } from "@prisma/client";
import { appUrl, businessUrl } from "@/lib/url";

export const SITE_NAME = "BeautyBook";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function hhmm(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

/** One line for search results: the owner's own words when she wrote some, otherwise a sensible default. */
export function businessDescription(b: Pick<Business, "name" | "tagline" | "about" | "address">, serviceNames: string[] = []) {
  const own = (b.tagline || b.about).replace(/\s+/g, " ").trim();
  const where = b.address ? ` ב${b.address}` : "";
  const what = serviceNames.length ? ` ${serviceNames.slice(0, 4).join(", ")}.` : "";
  const text = own ? `${own} · קביעת תור אונליין${where}.` : `${b.name}, קוסמטיקאית${where}.${what} קביעת תור אונליין בכמה שניות, בלי הרשמה.`;
  return text.length > 160 ? `${text.slice(0, 157)}…` : text;
}

/** schema.org BeautySalon, so Google can show the business with its address, hours and prices. */
export function businessJsonLd(
  b: Business,
  services: Pick<Service, "name" | "description" | "priceAgorot">[],
  hours: Pick<WorkingHours, "weekday" | "startMin" | "endMin">[],
  imageUrls: string[],
) {
  const url = businessUrl(b.slug);
  const instagram = b.instagram.replace(/^@/, "");
  return {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    "@id": `${url}#business`,
    name: b.name,
    url,
    description: businessDescription(b, services.map((s) => s.name)),
    ...(b.phone && { telephone: b.phone }),
    ...(b.address && { address: { "@type": "PostalAddress", streetAddress: b.address, addressCountry: "IL" } }),
    ...(imageUrls.length && { image: imageUrls.map((u) => appUrl(u)) }),
    ...(instagram && { sameAs: [`https://instagram.com/${instagram}`] }),
    ...(hours.length && {
      openingHoursSpecification: hours.map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${DAYS[h.weekday]}`,
        opens: hhmm(h.startMin),
        closes: hhmm(h.endMin),
      })),
    }),
    ...(services.length && {
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "טיפולים",
        itemListElement: services.map((s) => ({
          "@type": "Offer",
          price: (s.priceAgorot / 100).toFixed(2),
          priceCurrency: "ILS",
          itemOffered: { "@type": "Service", name: s.name, ...(s.description && { description: s.description }) },
        })),
      },
    }),
    potentialAction: { "@type": "ReserveAction", target: businessUrl(b.slug, "/book"), name: "קביעת תור" },
  };
}
