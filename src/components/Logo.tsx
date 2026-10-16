import Image from "next/image";
import Link from "next/link";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span dir="ltr" className={`font-display font-medium leading-none tracking-tight ${className}`}>
      Beauty<span className="italic">Book</span>
    </span>
  );
}

/** The rose-gold "B" monogram (transparent PNG, 374×400). */
export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return <Image src="/logo-mark.png" alt="" width={Math.round((size * 374) / 400)} height={size} className={className} priority />;
}

/** Monogram plus wordmark. `light` is for dark backgrounds. */
export function Logo({ href = "/", light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} dir="ltr" className={`inline-flex items-center gap-2 ${light ? "text-ivory" : "text-stone-900"}`} aria-label="BeautyBook">
      <LogoMark size={34} />
      <Wordmark className="text-[28px]" />
    </Link>
  );
}
