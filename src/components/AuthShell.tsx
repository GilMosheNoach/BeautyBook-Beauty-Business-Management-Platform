import { Logo } from "./Logo";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-8">
      <Logo />
      <div className="mt-10">
        <h1 className="h1">{title}</h1>
        {subtitle && <p className="muted mt-1">{subtitle}</p>}
      </div>
      <div className="mt-6">{children}</div>
    </main>
  );
}
