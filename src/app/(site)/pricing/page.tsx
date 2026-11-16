import type { Metadata } from "next";
import { PricingGrid } from "@/components/pricing-grid";

export const metadata: Metadata = { title: "Pricing" };

const faqs = [
  ["Is there a trial?", "Yes. Every new account includes 14 days with 100 screenings, 5 AI investigations and 3 custom rules. No card is required."],
  ["How does payment work?", "Create an account, then complete checkout from the Billing page using the same email address as your account. Your plan activates once the payment is confirmed."],
  ["What counts as a screening?", "Each transaction scored through the workspace, a CSV import or the API counts once. Limits reset on the first day of each calendar month."],
  ["What happens at the limit?", "Screening pauses until the next month or until you move to a larger plan. Existing data remains available."],
  ["Which plans include the API and connections graph?", "Growth and Scale. Starter includes the full workspace, rules, watchlists, customer risk and AI investigations."],
];

export default function Pricing() {
  return (
    <>
      <section className="hero-bg">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center">
          <h1 className="text-4xl font-medium sm:text-5xl">Pricing that scales with your transaction volume</h1>
          <p className="mt-5 text-lg text-ink-soft">Every plan includes screening, rules, customer risk, watchlists, case management and the AI investigator.</p>
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
