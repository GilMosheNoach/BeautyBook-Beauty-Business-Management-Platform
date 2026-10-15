import { requireBusiness } from "@/lib/session";
import { appUrl } from "@/lib/url";
import { SettingsForm } from "./SettingsForm";

export const metadata = { title: "הגדרות" };

export default async function SettingsPage() {
  const business = await requireBusiness();
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="h1">הגדרות</h1>
      <SettingsForm business={business} baseUrl={appUrl().replace(/^https?:\/\//, "")} />
    </div>
  );
}
