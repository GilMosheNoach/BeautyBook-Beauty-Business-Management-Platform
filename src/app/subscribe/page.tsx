import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { SubmitButton } from "@/components/SubmitButton";
import { PLAN_PRICE_AGOROT, REFERRAL_CREDIT_AGOROT, TRIAL_MONTHS, hasAccess, trialEndFrom } from "@/lib/billing";
import { formatPrice } from "@/lib/money";
import { requireUser } from "@/lib/session";
import { fmt } from "@/lib/time";
import { startCheckoutAction } from "@/server/actions/billing";
import { currentPrice, getSubscription } from "@/server/billing";
import { isTestBilling } from "@/server/payments";

export const metadata = { title: "תשלום" };

export default async function SubscribePage({ searchParams }: { searchParams: Promise<{ failed?: string }> }) {
  const user = await requireUser();
  const sub = await getSubscription(user.id);
  if (hasAccess(sub)) redirect(user.business ? "/dashboard" : "/onboarding");
  const { failed } = await searchParams;
  const isNew = sub.status === "INCOMPLETE";
  const price = await currentPrice(sub.id);
  const tz = user.business?.timezone ?? "Asia/Jerusalem";

  return (
    <AuthShell
      title={isNew ? "בחירת אמצעי תשלום" : "חידוש המנוי"}
      subtitle={isNew ? "עוד צעד אחד ויש לך דף הזמנות משלך." : "המנוי שלך לא פעיל כרגע. אחרי התשלום הכול חוזר לעבוד בדיוק כמו שהיה."}
    >
      {failed && (
        <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">התשלום לא עבר. אפשר לנסות שוב עם כרטיס אחר.</p>
      )}
      <section className="card">
        <p className="text-sm font-medium text-brand-700">BeautyBook Pro</p>
        {isNew ? (
          <>
            <p className="mt-1 text-3xl font-extrabold">{TRIAL_MONTHS === 2 ? "חודשיים" : `${TRIAL_MONTHS} חודשים`} חינם</p>
            <p className="muted mt-1">אחר כך {formatPrice(PLAN_PRICE_AGOROT)} לחודש. לא יבוצע חיוב היום.</p>
          </>
        ) : (
          <>
            <p className="mt-1 text-3xl font-extrabold">{formatPrice(price.totalAgorot)} לחודש</p>
            {price.discountAgorot > 0 && <p className="muted mt-1">כולל הנחת חברות של {formatPrice(price.discountAgorot)}</p>}
          </>
        )}
        <ul className="mt-4 space-y-2 text-sm text-stone-700">
          <li>✓ דף הזמנות אישי, יומן, לקוחות ושירותים ללא הגבלה</li>
          <li>✓ ביטול בכל רגע, בלי התחייבות</li>
          <li>
            ✓ על כל בעלת עסק שמצטרפת דרכך ומשלמת: {formatPrice(REFERRAL_CREDIT_AGOROT)} הנחה כל חודש. שלוש חברות משלמות = המנוי שלך בחינם.
          </li>
        </ul>
        {isNew && (
          <p className="mt-4 rounded-xl bg-stone-50 px-3 py-2 text-sm text-stone-600">
            החיוב הראשון יהיה ב-{fmt(trialEndFrom(new Date()), tz, "d.M.yyyy")}, ואפשר לבטל לפני כן בלי לשלם כלום.
          </p>
        )}
      </section>

      <form action={startCheckoutAction} className="mt-5">
        <SubmitButton className="btn-primary w-full py-3 text-base" pendingText="מעבירה לתשלום…">
          {isNew ? "הוספת כרטיס אשראי" : `תשלום ${formatPrice(price.totalAgorot)}`}
        </SubmitButton>
      </form>
      <p className="muted mt-3 text-center">
        🔒 פרטי הכרטיס מוזנים בעמוד המאובטח של חברת הסליקה ולא נשמרים אצלנו.
        {isTestBilling() && " (מצב בדיקה: לא מתבצע חיוב אמיתי)"}
      </p>
    </AuthShell>
  );
}
