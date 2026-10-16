import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LegalFooter } from "@/components/LegalFooter";
import { differenceInCalendarDays } from "date-fns";
import { db } from "@/lib/db";
import { requireBusiness } from "@/lib/session";
import { businessUrl } from "@/lib/url";
import { logoutAction } from "@/server/actions/auth";
import { startCheckoutAction } from "@/server/actions/billing";
import { SubmitButton } from "@/components/SubmitButton";
import { ExternalIcon } from "@/components/Icons";
import { BottomNav, TopNav } from "./NavLinks";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const business = await requireBusiness();
  const sub = await db.subscription.findUnique({ where: { userId: business.ownerId } });
  const trialNoCard = sub?.status === "TRIALING" && !sub.customerRef && sub.currentPeriodEnd;
  const daysLeft = trialNoCard ? Math.max(0, differenceInCalendarDays(sub.currentPeriodEnd!, new Date())) : 0;
  return (
    <div className="min-h-dvh pb-20 md:pb-8">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-ivory/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-10">
            <Logo href="/dashboard" />
            <TopNav />
          </div>
          <div className="flex items-center gap-2">
            <a href={businessUrl(business.slug)} target="_blank" className="btn-ghost btn-sm hidden sm:inline-flex">
              הדף שלי <ExternalIcon size={14} />
            </a>
            <Link href="/dashboard/billing" className="btn-ghost btn-sm">מנוי</Link>
            <form action={logoutAction}>
              <button className="btn-ghost btn-sm" type="submit">יציאה</button>
            </form>
          </div>
        </div>
      </header>
      {trialNoCard && (
        <div className="border-b border-stone-200 bg-stone-50">
          <form action={startCheckoutAction} className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
            <span>
              {daysLeft > 0 ? `נשארו ${daysLeft} ימים לתקופת הניסיון.` : "תקופת הניסיון הסתיימה."} כדי שהדף שלך ימשיך לעבוד אחריה, צריך להוסיף כרטיס אשראי.
            </span>
            <SubmitButton className="btn-primary btn-sm" pendingText="מעבירה…">הוספת כרטיס</SubmitButton>
          </form>
        </div>
      )}
      <main className="mx-auto max-w-6xl px-4 py-5">{children}</main>
      <LegalFooter className="mx-auto mt-8 max-w-6xl" />
      <BottomNav />
    </div>
  );
}
