import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { getCurrentUser } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "התחברות" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <AuthShell title="ברוכה השבה" subtitle="התחברי לניהול היומן והעסק שלך">
      <LoginForm />
      <p className="muted mt-6 text-center">
        עוד אין לך חשבון? <Link className="font-medium text-brand-600 underline underline-offset-4" href="/signup">הרשמה</Link>
      </p>
    </AuthShell>
  );
}
