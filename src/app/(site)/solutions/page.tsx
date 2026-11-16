import type { Metadata } from "next";
import { Cta, PageHero } from "@/components/cta";

export const metadata: Metadata = { title: "Solutions" };

const sols = [
  {
    t: "Payment processors and PSPs",
    problem: "Merchant and cardholder fraud erodes interchange margin, and review queues grow with every new portfolio.",
    how: ["Screen every authorization with velocity, geography and device signals", "Block known-bad devices, emails and IPs with imported blocklists", "Open cases for review and decline decisions, then let the AI investigator draft the assessment"],
    out: "Lower fraud losses and a review team that scales with volume instead of headcount.",
  },
  {
    t: "Fintechs and neobanks",
    problem: "Account fraud, money mules and first-party abuse appear across onboarding and payments, and compliance needs a record of every decision.",
    how: ["Rate customers by jurisdiction, PEP status, sanctions hits and behavior", "Screen names against your imported sanctions and PEP lists", "Keep a documented case history for audits and partner banks"],
    out: "Faster onboarding decisions and an audit trail that stands up to partner-bank review.",
  },
  {
    t: "Marketplaces and platforms",
    problem: "Fake sellers, collusion and multi-accounting drain payouts and damage trust on both sides of the market.",
    how: ["Expose clusters of accounts that share devices, emails or IP addresses", "Add custom rules for payout size, velocity and new-account behavior", "Escalate coordinated activity with AI-written summaries"],
    out: "Fewer fraudulent payouts and cleaner supply and demand.",
  },
  {
    t: "Merchants and e-commerce",
    problem: "Chargebacks and card testing cost money, while overly strict rules cost conversions.",
    how: ["Detect rapid small-amount testing and large first-time orders", "Tune review and decline thresholds to your risk appetite", "Use the API to decide at checkout in a single call"],
    out: "Fewer chargebacks without turning away good customers.",
  },
  {
    t: "Lenders and BNPL providers",
    problem: "Synthetic identities and bust-out behavior surface only after credit has been extended.",
    how: ["Flag identity reuse across applicant records", "Score applications on jurisdiction and behavioral signals", "Track customer risk tiers as transaction history builds"],
    out: "Earlier detection of high-risk applicants and lower credit losses.",
  },
];

export default function Solutions() {
  return (
    <>
      <PageHero title="Risk solutions for every team that moves money" lead="Different business models face different fraud patterns. FraudFenceAI gives each one the same auditable engine and an AI investigator that does the analysis." />
      <div className="mx-auto max-w-6xl space-y-6 px-5 py-16">
        {sols.map((s) => (
          <section key={s.t} className="card grid gap-6 p-7 md:grid-cols-3">
            <div>
              <h2 className="text-xl font-medium">{s.t}</h2>
              <p className="mt-2 text-sm text-ink-soft">{s.problem}</p>
            </div>
            <div>
              <p className="label">How FraudFenceAI helps</p>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink-soft">{s.how.map((h) => <li key={h}>{h}</li>)}</ul>
            </div>
            <div>
              <p className="label">Business outcome</p>
              <p className="text-sm font-medium">{s.out}</p>
            </div>
          </section>
        ))}
      </div>
      <Cta />
    </>
  );
}
