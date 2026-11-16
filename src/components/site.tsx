import Link from "next/link";
import { Logo } from "./logo";

const nav = [
  { href: "/products", label: "Platform" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <>
      <div className="bg-ink px-4 py-2 text-center text-[13px] text-white">
        Real-time transaction screening, case management and an AI investigator in one workspace.{" "}
        <Link href="/pricing" className="font-medium text-mint">See plans →</Link>
      </div>
      <header className="sticky top-0 z-30 border-b border-line/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-10">
            <Logo />
            <nav className="hidden gap-7 md:flex" aria-label="Main">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="text-sm text-ink-soft hover:text-ink">{n.label}</Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn btn-sm text-ink-soft hover:text-ink">Log in</Link>
            <Link href="/signup" className="btn-dark btn-sm">Start free trial</Link>
          </div>
        </div>
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-mist/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-ink-mute">
            Fraud prevention and AML tooling for lean risk teams. Deterministic scoring you can audit, with AI to speed up investigations.
          </p>
        </div>
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-mute">Product</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/products" className="hover:underline">Platform</Link></li>
            <li><Link href="/pricing" className="hover:underline">Pricing</Link></li>
            <li><Link href="/signup" className="hover:underline">Start free trial</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-mute">Company</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="hover:underline">About and contact</Link></li>
            <li><Link href="/login" className="hover:underline">Log in</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-ink-mute">
        © {new Date().getFullYear()} FraudFenceAI. Risk scores are decision support, not legal or compliance advice.
      </div>
    </footer>
  );
}
