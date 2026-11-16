import Link from "next/link";

export function Cta({ title = "Put AI at the center of your risk operation", body = "Create an account, screen your first transactions and watch the investigator work through your flagged cases." }: { title?: string; body?: string }) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 text-center">
      <h2 className="text-3xl font-medium sm:text-4xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-ink-soft">{body}</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/signup" className="btn-dark">Sign up</Link>
        <Link href="/login" className="btn-light">Log in</Link>
      </div>
    </section>
  );
}

export function PageHero({ title, lead }: { title: string; lead: string }) {
  return (
    <section className="hero-bg">
      <div className="mx-auto max-w-4xl px-5 py-20 text-center">
        <h1 className="text-4xl font-medium sm:text-5xl">{title}</h1>
        <p className="mt-5 text-lg text-ink-soft">{lead}</p>
      </div>
    </section>
  );
}

export function Prose({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="text-4xl font-medium">{title}</h1>
      <p className="mt-2 text-sm text-ink-mute">Last updated {updated}</p>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-ink-soft [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-medium [&_h2]:text-ink [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">{children}</div>
    </div>
  );
}
