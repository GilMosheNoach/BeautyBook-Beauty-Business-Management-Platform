"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "יומן", icon: "📅" },
  { href: "/dashboard/clients", label: "לקוחות", icon: "👩" },
  { href: "/dashboard/invite", label: "הזמנות", icon: "💌" },
  { href: "/dashboard/services", label: "שירותים", icon: "💅" },
  { href: "/dashboard/availability", label: "זמינות", icon: "🕘" },
  { href: "/dashboard/settings", label: "הגדרות", icon: "⚙️" },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard" || pathname.startsWith("/dashboard/appointments");
  return pathname.startsWith(href);
}

export function TopNav() {
  const pathname = usePathname();
  return (
    <nav className="hidden gap-1 md:flex">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${isActive(pathname, l.href) ? "bg-brand-50 text-brand-700" : "text-stone-600 hover:bg-stone-100"}`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive(pathname, l.href) ? "text-brand-700" : "text-stone-500"}`}
        >
          <span className="text-lg leading-none" aria-hidden>{l.icon}</span>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
