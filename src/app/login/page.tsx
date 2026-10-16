import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { redirectSignedInOwner } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "התחברות" };

export default async function LoginPage() {
  await redirectSignedInOwner("/login");
  return (
    <AuthShell title="ברוכה השבה" subtitle="התחברי לניהול היומן והעסק שלך">
      <LoginForm />
      <p className="muted mt-6 text-center">
        עוד אין לך חשבון? <Link className="font-medium text-brand-600 underline underline-offset-4" href="/signup">הרשמה</Link>
      </p>
    </AuthShell>
  );
}
