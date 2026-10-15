import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { LegalLinks } from "@/components/LegalFooter";
import { requireSubscribedUser } from "@/lib/session";
import { slugAffixes } from "@/lib/url";
import { OnboardingForm } from "./OnboardingForm";

export const metadata = { title: "הקמת העסק" };

export default async function OnboardingPage() {
  const user = await requireSubscribedUser();
  if (user.business) redirect("/dashboard");
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Logo />
      <h1 className="h1 mt-8">היי {user.name.split(" ")[0]}, בואי נקים את העסק שלך</h1>
      <p className="muted mt-1 mb-6">שלושה צעדים קצרים ויש לך דף הזמנות פעיל.</p>
      <OnboardingForm {...slugAffixes()} />
      <LegalLinks className="mt-12 text-stone-500" />
    </main>
  );
}
