import Link from "next/link";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span dir="ltr" className={`font-display font-medium leading-none tracking-tight ${className}`}>
      Beauty<span className="italic text-brand-600">Book</span>
    </span>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="text-stone-900" aria-label="BeautyBook">
      <Wordmark className="text-[28px]" />
    </Link>
  );
}
