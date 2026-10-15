import Link from "next/link";

/** The Terms of Use and Privacy Policy links shown at the bottom of every page. */
export function LegalLinks({ className = "" }: { className?: string }) {
  return (
    <nav aria-label="מידע משפטי" className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs ${className}`}>
      <Link href="/terms" className="underline-offset-4 hover:underline">תנאי שימוש</Link>
      <span aria-hidden className="opacity-40">·</span>
      <Link href="/privacy" className="underline-offset-4 hover:underline">מדיניות פרטיות</Link>
    </nav>
  );
}

/** A quiet footer strip for light pages that have no footer of their own. */
export function LegalFooter({ className = "" }: { className?: string }) {
  return (
    <footer className={`border-t border-stone-200 px-4 py-6 text-stone-500 ${className}`}>
      <LegalLinks />
      <p className="mt-2 text-center text-[11px] text-stone-400">© {new Date().getFullYear()} BeautyBook</p>
    </footer>
  );
}
