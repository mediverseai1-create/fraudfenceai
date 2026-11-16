import type { Metadata } from "next";
import { requireOrg } from "@/lib/session";
import { ActionForm, Field, Submit } from "@/components/forms";
import { DecisionBadge, Empty, PageHeader, ReasonList, money, when, type ReasonRow } from "@/components/ui";
import { CHANNELS } from "@/lib/risk/constants";
import { importTransactions, screenOne } from "../actions";

export const metadata: Metadata = { title: "Transactions" };

export default async function Transactions({ searchParams }: { searchParams: Promise<{ decision?: string }> }) {
  const sp = await searchParams;
  const { supabase, org, billing } = await requireOrg();
  let q = supabase.from("transactions").select("*").eq("org_id", org.id).order("created_at", { ascending: false }).limit(100);
  if (sp.decision && ["approve", "review", "decline"].includes(sp.decision)) q = q.eq("decision", sp.decision);
  const { data: txs } = await q;

  return (
    <>
      <PageHeader title="Transactions" subtitle="Screen a payment now, or import a batch. Each result lists the signals behind the decision." />
      {!billing.active && <p className="mb-4 text-sm text-warn">{billing.reason}</p>}
      <div className="grid gap-6 xl:grid-cols-3">
        <section className="card p-5 xl:col-span-2">
          <h2 className="mb-4 text-base font-medium">Screen a transaction</h2>
          <ActionForm action={screenOne} reset className="grid gap-4 sm:grid-cols-3">
            <Field label="Amount" name="amount" type="number" step="0.01" min={0} required placeholder="250.00" />
            <Field label="Currency" name="currency" placeholder="USD" maxLength={3} />
            <div>
              <label htmlFor="channel" className="label">Channel</label>
              <select id="channel" name="channel" className="input" defaultValue="card">{CHANNELS.map((c) => <option key={c}>{c}</option>)}</select>
            </div>
            <Field label="Customer reference" name="customer_ref" placeholder="cus_1042" hint="Builds history and risk rating." />
            <Field label="Email" name="email" type="email" placeholder="buyer@example.com" />
            <Field label="Device ID" name="device_id" placeholder="dev_8f2a" />
            <Field label="IP address" name="ip" placeholder="203.0.113.7" />
            <Field label="IP country (ISO-2)" name="ip_country" maxLength={2} placeholder="US" />
            <Field label="Billing country (ISO-2)" name="billing_country" maxLength={2} placeholder="US" />
            <Field label="Merchant (optional)" name="merchant" />
            <div className="flex items-end sm:col-span-2"><Submit pendingText="Screening…">Screen transaction</Submit></div>
          </ActionForm>
        </section>
        <section className="card p-5">
          <h2 className="mb-1 text-base font-medium">Import CSV</h2>
          <p className="mb-4 text-xs text-ink-mute">Up to 200 rows. Header names: amount, currency, channel, customer_ref, email, device_id, ip, ip_country, billing_country, merchant, occurred_at (ISO 8601).</p>
          <ActionForm action={importTransactions} reset>
            <input type="file" name="file" accept=".csv,text/csv" required aria-label="CSV file" className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-mist file:px-4 file:py-2 file:text-sm file:font-medium" />
            <Submit className="btn-dark btn-sm" pendingText="Importing…">Import and screen</Submit>
          </ActionForm>
        </section>
      </div>

      <section className="card mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
          <h2 className="text-base font-medium">History</h2>
          <div className="flex gap-1.5 text-xs">
            {[["", "All"], ["approve", "Approved"], ["review", "Review"], ["decline", "Declined"]].map(([v, l]) => (
              <a key={v} href={v ? `?decision=${v}` : "?"} className={`rounded-full border px-3 py-1 ${(sp.decision ?? "") === v ? "border-ink bg-ink text-white" : "border-line"}`}>{l}</a>
            ))}
          </div>
        </div>
        {txs?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="border-y border-line bg-mist/50"><tr><th className="th">When</th><th className="th">Customer</th><th className="th">Amount</th><th className="th">Channel</th><th className="th">Score</th><th className="th">Decision</th></tr></thead>
              <tbody className="divide-y divide-line">
                {txs.map((t) => (
                  <tr key={t.id} className="align-top">
                    <td className="td text-ink-mute">{when(t.created_at)}</td>
                    <td className="td">{t.customer_ref ?? "—"}</td>
                    <td className="td">{money(t.amount, t.currency)}</td>
                    <td className="td capitalize">{t.channel}</td>
                    <td className="td">
                      <details><summary className="cursor-pointer font-medium">{t.risk_score}</summary><div className="mt-2 w-64"><ReasonList reasons={t.reasons as ReasonRow[]} /></div></details>
                    </td>
                    <td className="td"><DecisionBadge decision={t.decision} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty title="No transactions" body={sp.decision ? "Nothing matches this filter." : "Screened transactions will be listed here."} />}
      </section>
    </>
  );
}
