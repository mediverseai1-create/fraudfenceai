import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Platform" };

const groups = [
  {
    title: "Prevent fraud on every payment",
    items: [
      ["Real-time screening", "Score card, ACH, wire, P2P and crypto transactions. Returns approve, review or decline with every contributing signal."],
      ["Velocity and anomaly signals", "Transaction counts per hour and day, spend versus the customer's own average, card-testing patterns and large first payments."],
      ["Device and identity linkage", "Detect devices and emails reused across customer records, the footprint of multi-accounting and synthetic identities."],
      ["Custom rules", "Combine your own conditions with points and an action. Rules run alongside built-in signals on every screening."],
    ],
  },
  {
    title: "Run AML and compliance checks",
    items: [
      ["Customer risk rating", "Low, medium and high tiers from jurisdiction, PEP status, sanctions hits and transaction behaviour, with the factors listed."],
      ["Watchlist and sanctions screening", "Import your own sanctions, PEP and blocklist files. Fuzzy matching handles transliteration and name order. Matching customers are flagged."],
      ["Case management", "Review and decline decisions open cases automatically. Work them through investigation to resolution with a note history."],
    ],
  },
  {
    title: "Investigate faster",
    items: [
      ["AI case investigator", "A structured assessment, recommended action and next steps drawn only from the case evidence, with caveats when data is thin."],
      ["Connections graph", "Clusters of customers who share devices, emails or IP addresses, ranked by size."],
      ["REST API", "Screen transactions from your own systems in real time with an API key (Growth and Scale plans)."],
    ],
  },
];

export default function Products() {
  return (
    <>
      <section className="hero-bg">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center">
          <h1 className="text-4xl font-medium sm:text-5xl">A complete risk toolkit, sized for your team</h1>
          <p className="mt-5 text-lg text-ink-soft">Screening, rules, customer risk, watchlists, cases and AI assistance share one data model.</p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl space-y-16 px-5 py-16">
        {groups.map((g) => (
          <section key={g.title}>
            <h2 className="text-2xl font-medium">{g.title}</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {g.items.map(([t, b]) => (
                <div key={t} className="card p-6">
                  <h3 className="text-lg font-medium">{t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{b}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
        <div className="card flex flex-col items-center gap-4 p-10 text-center">
          <h2 className="text-2xl font-medium">See it on your own data</h2>
          <Link href="/signup" className="btn-dark">Start free trial</Link>
        </div>
      </div>
    </>
  );
}
