"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, ClockIcon, ImageIcon, SendIcon, SettingsIcon, SparkleIcon, UsersIcon } from "@/components/Icons";

const LINKS = [
  { href: "/dashboard", label: "יומן", Icon: CalendarIcon },
  { href: "/dashboard/clients", label: "לקוחות", Icon: UsersIcon },
  { href: "/dashboard/invite", label: "הזמנות", Icon: SendIcon },
  { href: "/dashboard/services", label: "שירותים", Icon: SparkleIcon },
  { href: "/dashboard/availability", label: "זמינות", Icon: ClockIcon },
  { href: "/dashboard/design", label: "עיצוב הדף", Icon: ImageIcon },
  { href: "/dashboard/settings", label: "הגדרות", Icon: SettingsIcon },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard" || pathname.startsWith("/dashboard/appointments");
  return pathname.startsWith(href);
}

export function TopNav() {
  const pathname = usePathname();
  return (
    <nav className="hidden gap-6 md:flex">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`border-b py-1 text-sm tracking-wide transition ${isActive(pathname, l.href) ? "border-brand-600 text-stone-900" : "border-transparent text-stone-500 hover:text-stone-900"}`}
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
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-7 border-t border-stone-200 bg-ivory/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {LINKS.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className={`flex flex-col items-center gap-1 py-2 text-[10px] tracking-wide ${isActive(pathname, href) ? "text-brand-600" : "text-stone-500"}`}
        >
          <Icon size={20} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
