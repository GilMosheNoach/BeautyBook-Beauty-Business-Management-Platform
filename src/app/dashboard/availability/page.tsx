import { db } from "@/lib/db";
import { requireBusiness } from "@/lib/session";
import { fmt, localDateKey } from "@/lib/time";
import { deleteTimeOffAction } from "@/server/actions/availability";
import { HoursEditor } from "./HoursEditor";
import { TimeOffForm } from "./TimeOffForm";

export const metadata = { title: "זמינות" };

export default async function AvailabilityPage() {
  const business = await requireBusiness();
  const tz = business.timezone;
  const [hours, timeOff] = await Promise.all([
    db.workingHours.findMany({ where: { businessId: business.id }, orderBy: [{ weekday: "asc" }, { startMin: "asc" }] }),
    db.timeOff.findMany({ where: { businessId: business.id, endsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" } }),
  ]);
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
      <section className="card">
        <h1 className="h1">שעות עבודה</h1>
        <p className="muted mb-4 mt-1">לקוחות יוכלו להזמין רק בתוך השעות האלה. אפשר כמה טווחים ביום, למשל עם הפסקת צהריים.</p>
        <HoursEditor initial={hours.map((h) => ({ weekday: h.weekday, startMin: h.startMin, endMin: h.endMin }))} />
      </section>
      <div className="space-y-5">
        <section className="card">
          <h2 className="h2 mb-1">חופשות וחסימות</h2>
          <p className="muted mb-3">זמנים שבהם לא ניתן להזמין תור.</p>
          <TimeOffForm today={localDateKey(new Date(), tz)} />
        </section>
        {timeOff.length > 0 && (
          <section className="card">
            <h2 className="h2 mb-2">חסימות קרובות</h2>
            <ul className="divide-y divide-stone-100">
              {timeOff.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <div>
                    <p className="font-medium">{t.reason || "חסום"}</p>
                    <p className="muted">{fmt(t.startsAt, tz, "d.M HH:mm")} – {fmt(t.endsAt, tz, "d.M HH:mm")}</p>
                  </div>
                  <form action={deleteTimeOffAction}>
                    <input type="hidden" name="id" value={t.id} />
                    <button className="btn-ghost btn-sm text-red-700">הסרה</button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
