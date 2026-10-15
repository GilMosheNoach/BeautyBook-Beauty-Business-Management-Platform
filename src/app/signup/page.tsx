import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { getCurrentUser } from "@/lib/session";
import { findReferrer, normalizeReferralCode } from "@/server/billing";
import { SignupForm } from "./SignupForm";

export const metadata = { title: "הרשמה" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  if (await getCurrentUser()) redirect("/dashboard");
  const { ref } = await searchParams;
  const referrer = await findReferrer(ref);
  const referrerName = referrer ? referrer.user.business?.name ?? referrer.user.name : null;
  return (
    <AuthShell title="פותחים עסק ב-BeautyBook" subtitle="חודשיים ראשונים חינם, אחר כך ₪300 לחודש. אפשר לבטל בכל רגע.">
      {referrerName && (
        <p className="mb-4 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-800">הגעת בהזמנה של {referrerName} 💐</p>
      )}
      <SignupForm referralCode={referrer ? normalizeReferralCode(ref) : ""} />
      <p className="muted mt-6 text-center">
        כבר יש לך חשבון? <Link className="font-medium text-brand-600 underline underline-offset-4" href="/login">התחברות</Link>
      </p>
    </AuthShell>
  );
}
