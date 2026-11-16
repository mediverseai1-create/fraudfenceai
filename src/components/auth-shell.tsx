import { Logo } from "./logo";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="hero-bg flex min-h-screen flex-col items-center px-5 py-12">
      <Logo />
      <div className="card mt-10 w-full max-w-sm p-7">
        <h1 className="text-2xl font-medium">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-ink-soft">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <p className="mt-6 text-sm text-ink-soft">{footer}</p>}
    </div>
  );
}
