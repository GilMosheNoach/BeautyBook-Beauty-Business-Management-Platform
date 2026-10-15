import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 text-lg font-extrabold text-stone-900">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-600 text-white">B</span>
      BeautyBook
    </Link>
  );
}
