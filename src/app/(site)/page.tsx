import Link from "next/link";
import { ArrowRight, Bot, Network, ScanSearch, ShieldCheck, SlidersHorizontal, Users } from "lucide-react";

const modules = [
  { icon: ScanSearch, title: "Transaction screening", body: "Every payment gets a 0-100 risk score, a decision and the exact signals behind it. Use the dashboard, CSV import or the REST API." },
  { icon: SlidersHorizontal, title: "Rules engine", body: "Write your own rules on amount, velocity, geography and more. Choose whether a match flags, forces review or declines." },
  { icon: Users, title: "Customer risk rating", body: "Customers are tiered low, medium or high from jurisdiction, PEP status, sanctions hits and their own transaction history." },
  { icon: ShieldCheck, title: "Watchlists and sanctions", body: "Upload your sanctions, PEP and blocklist files. Fuzzy name matching catches spelling variants and reordered names." },
  { icon: Bot, title: "AI case investigator", body: "Open a case and get a structured summary, recommended action and next steps, written from your real evidence." },
  { icon: Network, title: "Connections graph", body: "See customers who share devices, emails or IP addresses, the pattern behind multi-accounting and fraud rings." },
];

export default function Home() {
  return (
    <>
      <section className="hero-bg">
        <div className="mx-auto max-w-6xl px-5 pb-20 pt-20 text-center md:pt-28">
          <p className="mx-auto mb-6 inline-flex rounded-full border border-line bg-white px-3.5 py-1 text-xs font-medium text-ink-soft">
            Fraud prevention and AML for lean risk teams
          </p>
          <h1 className="mx-auto max-w-3xl text-[40px] font-medium leading-[1.05] text-ink-mute sm:text-6xl">
            Stop fraud at the <span className="text-ink">point of payment,</span> not after the loss
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-soft">
            FraudFenceAI scores every transaction with transparent, auditable logic, opens cases for what needs a human,
            and uses AI to help analysts reach a decision faster.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup" className="btn-dark">Start 14-day trial <ArrowRight size={16} /></Link>
            <Link href="/products" className="btn-light">Explore the platform</Link>
          </div>
          <p className="mt-4 text-xs text-ink-mute">No card needed to start. Plans from $47 per month.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-medium sm:text-4xl">One workspace for the whole risk workflow</h2>
          <p className="mt-3 text-ink-soft">Modules that share the same data, so a flagged payment, its customer and its case stay connected.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <div key={m.title} className="card p-6">
              <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-mist text-ink"><m.icon size={20} /></span>
              <h3 className="text-lg font-medium">{m.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{m.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-mist/50">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-medium sm:text-4xl">Numbers from code. Explanations from AI.</h2>
            <p className="mt-4 text-ink-soft">
              Risk scores, velocity counts and customer tiers are computed by deterministic rules you can inspect, so every decision can be explained to an auditor.
              The AI investigator reads that evidence and writes the narrative. It never changes the score.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-ink-soft">
              <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-mint-deep" />Each decision lists the signals and points that produced it.</li>
              <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-mint-deep" />AI output is validated against a fixed format and labelled as advisory.</li>
              <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-mint-deep" />Your data is isolated per organization with row-level security.</li>
            </ul>
          </div>
          <div className="card p-6" aria-label="Illustrative example of an explained decision">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-mute">Illustrative example</p>
            <div className="mt-3 flex items-baseline justify-between">
              <p className="font-display text-xl">USD 1,800.00 · card</p>
              <span className="badge bg-red-50 text-danger">Decline · 82</span>
            </div>
            <ul className="mt-4 divide-y divide-line text-sm">
              {[["Amount is 12.0x this customer's average", 35], ["Device shared with 3 other customers", 35], ["IP country (RU) differs from billing country (US)", 20], ["Disposable email domain", 25]].map(([l, p]) => (
                <li key={l as string} className="flex justify-between py-2.5"><span>{l}</span><span className="font-medium text-ink-soft">+{p}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 text-center">
        <h2 className="text-3xl font-medium sm:text-4xl">Start screening in minutes</h2>
        <p className="mx-auto mt-3 max-w-xl text-ink-soft">Create an account, add a rule or two, and run your first transactions through the screening engine.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/signup" className="btn-dark">Start free trial</Link>
          <Link href="/pricing" className="btn-light">View pricing</Link>
        </div>
      </section>
    </>
  );
}
