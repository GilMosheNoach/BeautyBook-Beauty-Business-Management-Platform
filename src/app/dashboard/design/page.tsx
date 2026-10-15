import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireBusiness } from "@/lib/session";
import { MAX_GALLERY_IMAGES, imageUrl, pageImages } from "@/server/images";
import { deleteImageAction, moveImageAction } from "@/server/actions/images";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, ExternalIcon, ImageIcon } from "@/components/Icons";
import { ImageUpload } from "./ImageUpload";
import { PageTextsForm } from "./PageTextsForm";

export const metadata = { title: "עיצוב הדף" };

export default async function DesignPage() {
  const business = await requireBusiness();
  const [images, services] = await Promise.all([
    pageImages(business.id),
    db.service.findMany({ where: { businessId: business.id }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true, name: true, active: true } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">הדף שלך</p>
          <h1 className="h1 mt-1">עיצוב הדף</h1>
          <p className="muted mt-1">התמונות והמילים שהלקוחות רואות כשהן נכנסות לקבוע תור.</p>
        </div>
        <Link href={`/b/${business.slug}`} target="_blank" className="btn-secondary btn-sm">
          צפייה בדף <ExternalIcon size={14} />
        </Link>
      </div>

      <section className="card space-y-4">
        <div>
          <h2 className="h2">תמונה ראשית</h2>
          <p className="muted mt-1">התמונה הגדולה בראש הדף. כדאי לבחור תמונה לרוחב, של הסטודיו או של טיפול.</p>
        </div>
        <div className="relative aspect-[16/9] overflow-hidden bg-stone-900 sm:aspect-[21/9]">
          {images.coverId ? (
            <Image src={imageUrl(images.coverId)} alt="התמונה הראשית" fill sizes="(min-width: 896px) 896px, 100vw" className="object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-center text-ivory/70">
              <div className="space-y-2">
                <ImageIcon size={32} className="mx-auto" />
                <p className="text-sm">עדיין אין תמונה ראשית</p>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <ImageUpload kind="cover" className="btn-primary btn-sm">{images.coverId ? "החלפת תמונה" : "העלאת תמונה"}</ImageUpload>
          {images.coverId && <DeleteButton id={images.coverId} label="הסרה" />}
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="h2">טקסטים</h2>
        <PageTextsForm tagline={business.tagline} about={business.about} />
      </section>

      <section className="card space-y-4">
        <div>
          <h2 className="h2">תמונות לטיפולים</h2>
          <p className="muted mt-1">כשיש תמונה לפחות לטיפול אחד, הדף מציג את הטיפולים ככרטיסים גדולים עם תמונה.</p>
        </div>
        {services.length === 0 ? (
          <p className="text-sm text-stone-600">
            עוד אין שירותים. <Link href="/dashboard/services" className="underline">הוספת שירות</Link>
          </p>
        ) : (
          <ul className="divide-y divide-stone-200 border-y border-stone-200">
            {services.map((s) => {
              const imageId = images.byService.get(s.id);
              return (
                <li key={s.id} className="flex items-center gap-4 py-3">
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden bg-sand">
                    {imageId && <Image src={imageUrl(imageId)} alt="" fill sizes="56px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-lg">{s.name}</p>
                    {!s.active && <p className="muted">מוסתר מהדף</p>}
                  </div>
                  <div className="flex flex-wrap items-start justify-end gap-1">
                    <ImageUpload kind="service" serviceId={s.id} className="btn-ghost btn-sm border border-stone-300">{imageId ? "החלפה" : "הוספת תמונה"}</ImageUpload>
                    {imageId && <DeleteButton id={imageId} label="הסרה" />}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="h2">גלריה</h2>
            <p className="muted mt-1">עבודות, הסטודיו, לפני ואחרי. {images.gallery.length}/{MAX_GALLERY_IMAGES} תמונות.</p>
          </div>
          {images.gallery.length < MAX_GALLERY_IMAGES && (
            <ImageUpload kind="gallery" multiple className="btn-primary btn-sm">הוספת תמונות</ImageUpload>
          )}
        </div>
        {images.gallery.length === 0 ? (
          <div className="grid place-items-center border border-dashed border-stone-300 py-12 text-center text-stone-500">
            <ImageIcon size={28} />
            <p className="mt-2 text-sm">הגלריה ריקה. אפשר לבחור כמה תמונות בבת אחת.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {images.gallery.map((id, i) => (
              <li key={id} className="group relative aspect-square overflow-hidden bg-sand">
                <Image src={imageUrl(id)} alt={`תמונה ${i + 1}`} fill sizes="(min-width: 640px) 220px, 50vw" className="object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-stone-950/60 p-1 text-ivory">
                  <div className="flex">
                    {i > 0 && <MoveButton id={id} direction={-1} />}
                    {i < images.gallery.length - 1 && <MoveButton id={id} direction={1} />}
                  </div>
                  <form action={deleteImageAction}>
                    <input type="hidden" name="id" value={id} />
                    <button className="p-1.5 hover:text-white" aria-label={`מחיקת תמונה ${i + 1}`}><CloseIcon size={18} /></button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function DeleteButton({ id, label }: { id: string; label: string }) {
  return (
    <form action={deleteImageAction}>
      <input type="hidden" name="id" value={id} />
      <button className="btn-ghost btn-sm text-red-800">{label}</button>
    </form>
  );
}

function MoveButton({ id, direction }: { id: string; direction: -1 | 1 }) {
  return (
    <form action={moveImageAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="direction" value={direction} />
      <button className="p-1.5 hover:text-white" aria-label={direction === -1 ? "הזזה קדימה" : "הזזה אחורה"}>
        {direction === -1 ? <ChevronRightIcon size={18} /> : <ChevronLeftIcon size={18} />}
      </button>
    </form>
  );
}
