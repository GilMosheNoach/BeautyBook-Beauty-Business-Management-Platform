import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { getCurrentUser } from "@/lib/session";
import { SignupForm } from "./SignupForm";

export const metadata = { title: "הרשמה" };

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <AuthShell title="פותחים עסק ב-BeautyBook" subtitle="חינם, בלי כרטיס אשראי. תוך דקה יש לך דף הזמנות משלך.">
      <SignupForm />
      <p className="muted mt-6 text-center">
        כבר יש לך חשבון? <Link className="font-medium text-brand-700" href="/login">התחברות</Link>
      </p>
    </AuthShell>
  );
}
