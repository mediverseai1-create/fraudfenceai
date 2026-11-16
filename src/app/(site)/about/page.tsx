import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About" };

export default function About() {
  const support = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  return (
    <div className="mx-auto max-w-3xl px-5 py-20">
      <h1 className="text-4xl font-medium sm:text-5xl">Risk operations should run at the speed of payments</h1>
      <div className="mt-8 space-y-5 text-ink-soft">
        <p>
          Payment volumes grow faster than review teams. Fraud losses, false declines and compliance backlogs all follow from the same constraint: too much evidence, too few analysts, and tools that were never designed to work together.
        </p>
        <p>
          FraudFenceAI is built to remove that constraint. It scores every transaction with logic that can be audited, hands every flagged case to an AI investigator that does the analysis, and keeps screening, customers, watchlists and cases in one system of record.
        </p>
      </div>
      <h2 className="mt-12 text-2xl font-medium">Principles</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-3">
        {[
          ["Auditable by default", "Every score lists the signals behind it. Every outcome can be reproduced and explained."],
          ["AI where judgment is slow", "AI investigates, summarizes and recommends. It never invents numbers or replaces the analyst's decision."],
          ["Isolation by design", "Each organization's data is separated at the database layer, and billing controls are locked from the client."],
        ].map(([t, b]) => (
          <div key={t} className="card p-5"><h3 className="font-medium">{t}</h3><p className="mt-2 text-sm text-ink-soft">{b}</p></div>
        ))}
      </div>
      {support && (
        <p className="mt-10 text-sm text-ink-soft">
          Support: <a className="font-medium text-ink underline" href={`mailto:${support}`}>{support}</a>. Include the email address of your FraudFenceAI account.
        </p>
      )}
      <div className="mt-10 flex gap-3">
        <Link href="/signup" className="btn-dark">Sign up</Link>
        <Link href="/login" className="btn-light">Log in</Link>
      </div>
    </div>
  );
}
