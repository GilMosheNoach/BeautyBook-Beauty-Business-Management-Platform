import { notFound, redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { SubmitButton } from "@/components/SubmitButton";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { completeTestCheckoutAction } from "@/server/actions/billing";
import { isTestBilling } from "@/server/payments";

export const metadata = { title: "תשלום (מצב בדיקה)" };

/** Stands in for the gateway's hosted card page during local development. */
export default async function TestCheckoutPage({ params }: { params: Promise<{ token: string }> }) {
  if (!isTestBilling()) notFound();
  const user = await requireUser();
  const { token } = await params;
  const sub = await db.subscription.findUnique({ where: { checkoutToken: token } });
  if (!sub || sub.userId !== user.id) redirect("/subscribe");
  const action = completeTestCheckoutAction.bind(null, token);

  return (
    <AuthShell title="עמוד תשלום לדוגמה" subtitle="כאן יופיע העמוד המאובטח של חברת הסליקה.">
      <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
        מצב בדיקה: לא מזינים כאן פרטי כרטיס ולא מתבצע שום חיוב. בוחרים איך הכרטיס יתנהג בחיובים הבאים.
      </p>
      <form action={action} className="mt-5 space-y-3">
        <SubmitButton className="btn-primary w-full py-3 text-base" name="outcome" value="approve" pendingText="מאשרת…">
          אישור עם כרטיס בדיקה תקין (4242)
        </SubmitButton>
        <SubmitButton className="btn-secondary w-full" name="outcome" value="decline" pendingText="מאשרת…">
          כרטיס בדיקה שיידחה בחיוב (0002)
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
