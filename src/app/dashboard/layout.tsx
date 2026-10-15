import Link from "next/link";
import { Logo } from "@/components/Logo";
import { requireBusiness } from "@/lib/session";
import { logoutAction } from "@/server/actions/auth";
import { BottomNav, TopNav } from "./NavLinks";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const business = await requireBusiness();
  return (
    <div className="min-h-dvh pb-20 md:pb-8">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Logo href="/dashboard" />
            <TopNav />
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/b/${business.slug}`} target="_blank" className="btn-ghost btn-sm hidden sm:inline-flex">
              הדף שלי ↗
            </Link>
            <form action={logoutAction}>
              <button className="btn-ghost btn-sm" type="submit">יציאה</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5">{children}</main>
      <BottomNav />
    </div>
  );
}
