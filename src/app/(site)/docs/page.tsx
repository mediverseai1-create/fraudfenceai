import type { Metadata } from "next";
import { Cta, PageHero } from "@/components/cta";

export const metadata: Metadata = { title: "API documentation" };

const fields = [
  ["amount", "number", "Required. Transaction amount, 0 or greater."],
  ["currency", "string", "ISO 4217 code such as USD. Defaults to USD."],
  ["channel", "string", "card, ach, wire, p2p or crypto. Defaults to card."],
  ["customer_ref", "string", "Your identifier for the customer. Enables history, velocity and risk rating."],
  ["email", "string", "Customer email address."],
  ["device_id", "string", "Device identifier from your own fingerprinting."],
  ["ip", "string", "Customer IP address."],
  ["ip_country", "string", "Two-letter country of the IP address."],
  ["billing_country", "string", "Two-letter billing country."],
  ["merchant", "string", "Merchant or counterparty name."],
  ["occurred_at", "string", "ISO 8601 timestamp. Defaults to now."],
];

export default function Docs() {
  return (
    <>
      <PageHero title="API documentation" lead="Screen a transaction with one authenticated request and receive a decision, a score and the reasons behind it." />
      <div className="mx-auto max-w-4xl space-y-12 px-5 py-16">
        <section>
          <h2 className="text-2xl font-medium">Authentication</h2>
          <p className="mt-2 text-sm text-ink-soft">Create a key in Settings (Growth and Scale plans). Send it as a bearer token. Keys are shown once and can be revoked at any time.</p>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-ink p-4 text-xs text-white">Authorization: Bearer ffk_...</pre>
        </section>
        <section>
          <h2 className="text-2xl font-medium">Screen a transaction</h2>
          <p className="mt-2 text-sm text-ink-soft"><code>POST /api/v1/screen</code> with a JSON body.</p>
          <div className="card mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead className="border-b border-line bg-mist/50"><tr><th className="th">Field</th><th className="th">Type</th><th className="th">Description</th></tr></thead>
              <tbody className="divide-y divide-line">{fields.map(([f, t, d]) => <tr key={f}><td className="td font-mono text-xs">{f}</td><td className="td text-ink-soft">{t}</td><td className="td text-ink-soft">{d}</td></tr>)}</tbody>
            </table>
          </div>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-ink p-4 text-xs leading-relaxed text-white">{`curl -X POST https://YOUR_DOMAIN/api/v1/screen \\
  -H "Authorization: Bearer ffk_..." \\
  -H "Content-Type: application/json" \\
  -d '{"amount": 900, "channel": "wire", "customer_ref": "cus_1042",
       "ip_country": "KP", "billing_country": "US"}'`}</pre>
        </section>
        <section>
          <h2 className="text-2xl font-medium">Response</h2>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-ink p-4 text-xs leading-relaxed text-white">{`{
  "transaction_id": "uuid",
  "case_id": "uuid or null",
  "decision": "approve | review | decline",
  "risk_score": 0-100,
  "reasons": [{ "code": "geo_mismatch", "label": "...", "points": 20 }]
}`}</pre>
        </section>
        <section>
          <h2 className="text-2xl font-medium">Status codes</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ink-soft">
            <li><strong className="text-ink">200</strong>: transaction screened.</li>
            <li><strong className="text-ink">401</strong>: missing or invalid API key.</li>
            <li><strong className="text-ink">402</strong>: plan inactive or expired.</li>
            <li><strong className="text-ink">403</strong>: plan does not include API access.</li>
            <li><strong className="text-ink">422</strong>: invalid input. The message names the field.</li>
            <li><strong className="text-ink">429</strong>: monthly screening limit reached.</li>
          </ul>
        </section>
      </div>
      <Cta title="Get an API key" body="Create an account and upgrade to Growth or Scale to generate keys." />
    </>
  );
}
