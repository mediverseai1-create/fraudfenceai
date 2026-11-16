import type { Metadata } from "next";
import { Cta, PageHero } from "@/components/cta";

export const metadata: Metadata = { title: "Fraud and AML glossary" };

const terms = [
  ["AML (anti-money laundering)", "Controls and processes that detect and prevent the movement of illicit funds through the financial system."],
  ["KYC (know your customer)", "Verification of a customer's identity and risk profile before and during a business relationship."],
  ["PEP (politically exposed person)", "An individual in a prominent public role whose position can carry higher corruption or bribery risk."],
  ["Sanctions screening", "Checking customers and counterparties against lists of sanctioned individuals, entities and jurisdictions."],
  ["Velocity check", "A rule that measures how many transactions occur within a time window to expose automated or abusive behavior."],
  ["Card testing", "Fraudsters submit many small purchases to confirm which stolen card numbers are valid."],
  ["Money mule", "A person who moves illicit funds on behalf of others, knowingly or unknowingly."],
  ["Synthetic identity", "An identity built by combining real and fabricated information to open accounts or obtain credit."],
  ["Chargeback", "A forced reversal of a card payment initiated by the cardholder's bank, often after disputed or fraudulent activity."],
  ["Multi-accounting", "One person or group operating several accounts to abuse promotions, limits or controls."],
  ["False positive", "A legitimate transaction or customer incorrectly flagged as risky."],
  ["Case management", "The workflow for reviewing, documenting and resolving flagged activity."],
];

export default function Glossary() {
  return (
    <>
      <PageHero title="Fraud and AML glossary" lead="Plain definitions of the terms risk, fraud and compliance teams use every day." />
      <dl className="mx-auto max-w-3xl divide-y divide-line px-5 py-12">
        {terms.map(([t, d]) => (<div key={t} className="py-5"><dt className="font-display text-lg font-medium">{t}</dt><dd className="mt-1.5 text-sm text-ink-soft">{d}</dd></div>))}
      </dl>
      <Cta />
    </>
  );
}
