import { CopyButton } from "@/components/CopyButton";
import { SubmitButton } from "@/components/SubmitButton";
import { PLAN_PRICE_AGOROT, REFERRAL_CREDIT_AGOROT, SUBSCRIPTION_LABEL } from "@/lib/billing";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { requireBusiness } from "@/lib/session";
import { fmt } from "@/lib/time";
import { appUrl } from "@/lib/url";
import { resumeSubscriptionAction, simulateRenewalAction, startCheckoutAction } from "@/server/actions/billing";
import { currentPrice, getSubscription } from "@/server/billing";
import { isTestBilling } from "@/server/payments";
import { CancelSubscription } from "./CancelSubscription";

export const metadata = { title: "מנוי והפניות" };

const STATUS_CLASS = {
  INCOMPLETE: "bg-stone-200 text-stone-700",
  TRIALING: "border border-stone-900 text-stone-900",
  ACTIVE: "bg-stone-900 text-ivory",
  PAST_DUE: "bg-red-100 text-red-800",
  CANCELED: "bg-stone-200 text-stone-700",
} as const;

function referralLabel(status: keyof typeof STATUS_CLASS, paid: boolean) {
  if (status === "ACTIVE" && paid) return { text: `משלמת · ${formatPrice(REFERRAL_CREDIT_AGOROT)} הנחה`, cls: STATUS_CLASS.ACTIVE };
  if (status === "TRIALING" || status === "INCOMPLETE") return { text: "עוד לא משלמת", cls: STATUS_CLASS.TRIALING };
  if (status === "PAST_DUE") return { text: "התשלום שלה נכשל", cls: STATUS_CLASS.PAST_DUE };
  return { text: "ביטלה מנוי", cls: STATUS_CLASS.CANCELED };
}

export default async function BillingPage() {
  const business = await requireBusiness();
  const sub = await getSubscription(business.ownerId);
  const [price, referrals, payments] = await Promise.all([
    currentPrice(sub.id),
    db.subscription.findMany({
      where: { referredById: sub.id },
      select: { id: true, status: true, firstPaidAt: true, createdAt: true, user: { select: { name: true, business: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    db.payment.findMany({ where: { subscriptionId: sub.id }, orderBy: { createdAt: "desc" }, take: 12 }),
  ]);
  const tz = business.timezone;
  const day = (d: Date | null) => (d ? fmt(d, tz, "d.M.yyyy") : "");
  const referralUrl = appUrl(`/signup?ref=${sub.referralCode}`);
  const shareText = `אני מנהלת את התורים שלי ב-BeautyBook. נרשמים כאן ומקבלים חודשיים חינם: ${referralUrl}`;
  const renews = sub.status === "TRIALING" || sub.status === "ACTIVE";

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_24rem]">
      <div className="space-y-5">
        <section className="card">
          <div className="flex items-center justify-between gap-2">
            <h1 className="h1">המנוי שלי</h1>
            <span className={`badge ${STATUS_CLASS[sub.status]}`}>{SUBSCRIPTION_LABEL[sub.status]}</span>
          </div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="muted">מחיר החודש הבא</dt>
              <dd className="text-xl font-bold">{formatPrice(price.totalAgorot)}</dd>
              {price.discountAgorot > 0 && (
                <dd className="muted">
                  {formatPrice(PLAN_PRICE_AGOROT)} פחות {formatPrice(price.discountAgorot)} הנחת חברות
                </dd>
              )}
            </div>
            <div>
              <dt className="muted">{renews ? (sub.status === "TRIALING" ? "תקופת הניסיון נגמרת" : "החיוב הבא") : "גישה עד"}</dt>
              <dd className="text-xl font-bold">{day(sub.currentPeriodEnd)}</dd>
              {sub.cardLast4 && <dd className="muted" dir="ltr">•••• {sub.cardLast4}</dd>}
            </div>
          </dl>
          {sub.status === "PAST_DUE" && (
            <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">החיוב האחרון נכשל. כדאי לעדכן כרטיס כדי שהדף שלך ימשיך לעבוד.</p>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            {sub.status === "CANCELED" ? (
              <form action={resumeSubscriptionAction}>
                <SubmitButton className="btn-primary">חידוש המנוי</SubmitButton>
              </form>
            ) : (
              <form action={startCheckoutAction}>
                <SubmitButton className={sub.status === "PAST_DUE" ? "btn-primary" : "btn-secondary"} pendingText="מעבירה…">
                  {sub.status === "PAST_DUE" ? "עדכון כרטיס ותשלום" : "עדכון כרטיס"}
                </SubmitButton>
              </form>
            )}
            {renews || sub.status === "PAST_DUE" ? <CancelSubscription until={day(sub.currentPeriodEnd)} /> : null}
          </div>
        </section>

        <section className="card">
          <h2 className="h2">היסטוריית חיובים</h2>
          {payments.length === 0 ? (
            <p className="muted mt-2">עוד אין חיובים.</p>
          ) : (
            <ul className="mt-2 divide-y divide-stone-100 text-sm">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                  <div>
                    <p className="font-medium">
                      {day(p.periodStart)} – {day(p.periodEnd)}
                    </p>
                    {p.discountAgorot > 0 && <p className="muted">הנחה על {p.referralCount} חברות: {formatPrice(p.discountAgorot)}</p>}
                    {p.failureReason && <p className="text-red-700">{p.failureReason}</p>}
                  </div>
                  <span className={`badge ${p.status === "SUCCEEDED" ? STATUS_CLASS.ACTIVE : STATUS_CLASS.PAST_DUE}`}>
                    {p.status === "SUCCEEDED" ? formatPrice(p.amountAgorot) : "נכשל"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {isTestBilling() && (
          <section className="card border-dashed border-stone-400 bg-stone-50">
            <h2 className="h2">כלי בדיקה</h2>
            <p className="muted mt-1">מדמה את סוף תקופת הניסיון או החודש ומחייב עכשיו לפי ההנחות הנוכחיות. מופיע רק במצב בדיקה.</p>
            <form action={simulateRenewalAction} className="mt-3">
              <SubmitButton className="btn-secondary" pendingText="מחייבת…">דילוג לחיוב הבא</SubmitButton>
            </form>
          </section>
        )}
      </div>

      <div className="space-y-5">
        <section className="card">
          <h2 className="h2">מביאים חברה, משלמים פחות</h2>
          <p className="muted mt-1">
            על כל בעלת עסק שנרשמת דרך הקישור שלך ומתחילה לשלם, המנוי שלך יורד ב-{formatPrice(REFERRAL_CREDIT_AGOROT)} כל חודש. שלוש חברות משלמות = מנוי בחינם. אם חברה מבטלת, ההנחה עליה מתבטלת.
          </p>
          <code className="mt-3 block break-all rounded-lg bg-stone-50 px-3 py-2 text-sm" dir="ltr">{referralUrl}</code>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyButton text={referralUrl} />
            <a className="btn-secondary" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}>
              שיתוף בוואטסאפ
            </a>
          </div>
        </section>
        <section className="card">
          <h2 className="h2">
            החברות שהבאת <span className="muted">({price.referrals} משלמות)</span>
          </h2>
          {referrals.length === 0 ? (
            <p className="muted mt-2">עוד אף אחת לא נרשמה דרכך.</p>
          ) : (
            <ul className="mt-2 divide-y divide-stone-100 text-sm">
              {referrals.map((r) => {
                const label = referralLabel(r.status, !!r.firstPaidAt);
                return (
                  <li key={r.id} className="flex items-center justify-between gap-2 py-2">
                    <div>
                      <p className="font-medium">{r.user.business?.name ?? r.user.name}</p>
                      <p className="muted">הצטרפה ב-{day(r.createdAt)}</p>
                    </div>
                    <span className={`badge ${label.cls}`}>{label.text}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
