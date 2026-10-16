import { GateBar } from "./GateBar";
import { LegalLinks } from "./LegalFooter";
import { Logo } from "./Logo";

export function AuthShell({
  title,
  subtitle,
  back,
  backLabel,
  children,
}: {
  title: string;
  subtitle?: string;
  /** Shows a back arrow to this path and a log-out button, for signed-in screens. */
  back?: string;
  backLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-10">
      {back ? (
        <GateBar back={back} backLabel={backLabel} />
      ) : (
        <div className="flex justify-center">
          <Logo />
        </div>
      )}
      <div className="mt-14 text-center">
        <h1 className="font-serif text-4xl font-extralight">{title}</h1>
        {subtitle && <p className="muted mt-2">{subtitle}</p>}
      </div>
      <div className="card mt-8">{children}</div>
      <LegalLinks className="mt-auto pt-10 text-stone-500" />
    </main>
  );
}
