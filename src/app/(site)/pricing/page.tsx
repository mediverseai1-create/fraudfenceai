import type { Metadata } from "next";
import { PricingGrid } from "@/components/pricing-grid";

export const metadata: Metadata = { title: "Pricing" };

const faqs = [
  ["Is there a free trial?", "Yes. Every new account gets 14 days with 100 screenings, 5 AI investigations and 3 custom rules. No card is needed."],
  ["How does payment work?", "You pay through our secure checkout (Selar). Use the same email as your FraudFenceAI account. Your plan is activated once the payment is confirmed."],
  ["What counts as a screening?", "Each transaction scored through the dashboard, CSV import or API counts once. Limits reset on the first day of each calendar month."],
  ["What happens at the limit?", "Screening pauses until the next month or until you move to a larger plan. Existing data stays available."],
];

export default function Pricing() {
  return (
    <>
      <section className="hero-bg">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center">
          <h1 className="text-4xl font-medium sm:text-5xl">Simple pricing that scales with volume</h1>
          <p className="mt-5 text-lg text-ink-soft">Every plan includes screening, rules, customer risk, watchlists, cases and the AI investigator.</p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-5 py-14">
        <PricingGrid />
        <div className="mx-auto mt-20 max-w-3xl">
          <h2 className="text-2xl font-medium">Questions</h2>
          <dl className="mt-6 divide-y divide-line">
            {faqs.map(([q, a]) => (
              <div key={q} className="py-5">
                <dt className="font-medium">{q}</dt>
                <dd className="mt-1.5 text-sm text-ink-soft">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </>
  );
}
