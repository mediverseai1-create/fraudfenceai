import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Platform" };

const groups = [
  {
    title: "Stop fraud at the point of payment",
    lead: "Revenue protection starts before the money moves. FraudFenceAI evaluates every transaction in real time and returns a decision with its reasoning.",
    items: [
      ["Real-time screening", "Score card, ACH, wire, P2P and crypto transactions. Each response contains the decision, a 0 to 100 score and every contributing signal."],
      ["Velocity and anomaly detection", "Transaction counts per hour and per day, spend against each customer's own average, card-testing patterns and unusually large first payments."],
      ["Device and identity linkage", "Surface devices and emails reused across customer records, the footprint of multi-accounting, synthetic identities and mule activity."],
      ["Custom policy rules", "Turn your fraud policy into rules with points and actions. They run alongside built-in signals on every screening."],
    ],
  },
  {
    title: "Run AML and compliance with confidence",
    lead: "Compliance outcomes depend on consistent, documented decisions. The platform records the evidence behind every one.",
    items: [
      ["Customer risk rating", "Low, medium and high tiers built from jurisdiction, PEP status, sanctions hits and transaction behavior, with every factor listed."],
      ["Watchlist and sanctions screening", "Import your own sanctions, PEP and blocklist data. Fuzzy matching handles transliteration and name order, and matching customers are flagged."],
      ["Case management", "Review and decline decisions open cases automatically. Teams work them through investigation to resolution with notes and status history."],
    ],
  },
  {
    title: "Investigate at machine speed",
    lead: "Investigation is where risk teams lose the most time. AI takes over the reading, weighing and drafting.",
    items: [
      ["AI case investigator", "A structured assessment, a recommended action, key indicators, next steps and caveats, drawn only from the case evidence and validated against a fixed format."],
      ["Connections graph", "Clusters of customers who share devices, emails or IP addresses, ranked by size, so coordinated activity is visible at a glance."],
      ["REST API", "Embed decisions in your payment flow with a bearer-token endpoint. Available on the Growth and Scale plans."],
    ],
  },
];

export default function Products() {
  return (
    <>
      <section className="hero-bg">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center">
          <h1 className="text-4xl font-medium sm:text-5xl">The AI-native platform for the full risk lifecycle</h1>
          <p className="mt-5 text-lg text-ink-soft">Screening, rules, customer risk, watchlists, cases and AI investigation share one data model, so every decision is informed by everything the platform knows.</p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl space-y-16 px-5 py-16">
        {groups.map((g) => (
          <section key={g.title}>
            <h2 className="text-2xl font-medium sm:text-3xl">{g.title}</h2>
            <p className="mt-2 max-w-3xl text-ink-soft">{g.lead}</p>
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
        <section>
          <h2 className="text-2xl font-medium sm:text-3xl">How a flagged payment is resolved</h2>
          <ol className="mt-6 grid gap-5 md:grid-cols-3">
            {[
              ["1. Decision", "A transaction arrives and is scored. A review or decline decision stores the full list of signals and opens a case."],
              ["2. Investigation", "The AI investigator reads the transaction, the customer profile and recent history, then recommends an action with caveats."],
              ["3. Resolution", "An analyst records notes and closes the case as fraud or legitimate. The outcome updates the customer's risk tier."],
            ].map(([t, b]) => (
              <li key={t} className="card p-6"><h3 className="font-medium">{t}</h3><p className="mt-2 text-sm leading-relaxed text-ink-soft">{b}</p></li>
            ))}
          </ol>
        </section>
        <div className="card flex flex-col items-center gap-4 p-10 text-center">
          <h2 className="text-2xl font-medium">Run your own transactions through the platform</h2>
          <div className="flex gap-3">
            <Link href="/signup" className="btn-dark">Sign up</Link>
            <Link href="/login" className="btn-light">Log in</Link>
          </div>
        </div>
      </div>
    </>
  );
}
