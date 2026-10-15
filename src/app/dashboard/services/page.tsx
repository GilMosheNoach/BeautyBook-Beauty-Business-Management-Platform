import { db } from "@/lib/db";
import { requireBusiness } from "@/lib/session";
import { formatPrice } from "@/lib/money";
import { pageImages } from "@/server/images";
import { ServiceForm } from "./ServiceForm";
import { ServiceRow } from "./ServiceRow";

export const metadata = { title: "שירותים ומחירים" };

export default async function ServicesPage() {
  const business = await requireBusiness();
  const [services, images] = await Promise.all([
    db.service.findMany({
      where: { businessId: business.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    pageImages(business.id),
  ]);
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
      <section className="card">
        <h1 className="h1">שירותים ומחירים</h1>
        <p className="muted mt-1">אלה השירותים שהלקוחות רואות בדף שלך. תמונה לכל טיפול מופיעה על הכרטיס שלו בדף.</p>
        {services.length === 0 ? (
          <p className="mt-6 text-stone-600">עוד אין שירותים. הוסיפי את הראשון בטופס.</p>
        ) : (
          <ul className="mt-4 divide-y divide-stone-100">
            {services.map((s) => (
              <ServiceRow
                key={s.id}
                service={{
                  id: s.id,
                  name: s.name,
                  description: s.description,
                  durationMin: s.durationMin,
                  price: s.priceAgorot / 100,
                  priceLabel: formatPrice(s.priceAgorot),
                  active: s.active,
                  imageId: images.byService.get(s.id) ?? null,
                }}
              />
            ))}
          </ul>
        )}
      </section>
      <section className="card h-fit">
        <h2 className="h2 mb-3">שירות חדש</h2>
        <ServiceForm />
      </section>
    </div>
  );
}
