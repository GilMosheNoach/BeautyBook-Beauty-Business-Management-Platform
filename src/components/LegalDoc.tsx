import { Logo } from "./Logo";
import { LegalFooter } from "./LegalFooter";

/** Page frame for the Terms of Use and Privacy Policy. */
export function LegalDoc({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-stone-50">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between border-b border-stone-200 px-4 py-5">
        <Logo />
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <p className="eyebrow">מידע משפטי</p>
        <h1 className="mt-3 font-serif text-4xl font-extralight sm:text-5xl">{title}</h1>
        <p className="muted mt-3">עודכן לאחרונה: {updated}</p>
        <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-stone-800">{children}</div>
      </main>
      <LegalFooter />
    </div>
  );
}

export function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section id={`s${n}`} className="scroll-mt-6">
      <h2 className="flex items-baseline gap-3 font-serif text-2xl font-extralight">
        <span className="font-display text-xl lining-nums text-stone-400">{String(n).padStart(2, "0")}</span>
        {title}
      </h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

export function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 ps-5 marker:text-stone-400">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

/** A detail from OPERATOR, or a visible marker when it hasn't been filled in yet. */
export function Detail({ value, label }: { value: string; label: string }) {
  if (value) return <>{value}</>;
  return <mark className="rounded bg-stone-200 px-1.5 py-0.5 text-stone-900">[להשלמה: {label}]</mark>;
}
