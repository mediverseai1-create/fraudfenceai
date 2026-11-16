import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrg } from "@/lib/session";
import { ActionForm, Submit } from "@/components/forms";
import { InvestigateButton } from "@/components/investigate-button";
import { DecisionBadge, LevelBadge, ReasonList, money, when, type ReasonRow } from "@/components/ui";
import type { Investigation } from "@/lib/ai/gemini";
import { addCaseNote, setCaseStatus } from "../../actions";

export const metadata: Metadata = { title: "Case" };

const STATUSES = [["open", "Open"], ["investigating", "Investigating"], ["resolved_fraud", "Resolved: fraud"], ["resolved_legit", "Resolved: legitimate"]];
const ASSESS: Record<string, string> = { likely_fraud: "Likely fraud", suspicious: "Suspicious", likely_legitimate: "Likely legitimate", insufficient_data: "Insufficient data" };
const ACTION: Record<string, string> = { decline: "Decline", escalate: "Escalate to a senior analyst", request_information: "Request more information", approve: "Approve" };

export default async function CaseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, org } = await requireOrg();
  const { data: c } = await supabase.from("cases").select("*").eq("id", id).eq("org_id", org.id).maybeSingle();
  if (!c) notFound();
  const [{ data: tx }, { data: cust }, { data: notes }] = await Promise.all([
    c.transaction_id ? supabase.from("transactions").select("*").eq("id", c.transaction_id).eq("org_id", org.id).maybeSingle() : Promise.resolve({ data: null }),
    c.customer_id ? supabase.from("customers").select("*").eq("id", c.customer_id).eq("org_id", org.id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("case_notes").select("id, body, created_at").eq("case_id", id).eq("org_id", org.id).order("created_at"),
  ]);
  const ai = c.ai_summary as (Investigation & { generated_at: string }) | null;

  return (
    <>
      <Link href="/app/cases" className="text-sm text-ink-soft underline">← All cases</Link>
      <div className="mb-6 mt-2 flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-2xl font-medium">{c.title}</h1><p className="mt-1 text-xs text-ink-mute">Opened {when(c.created_at)}</p></div>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map(([v, l]) => (
            <form key={v} action={setCaseStatus.bind(null, id, v)}>
              <button aria-pressed={c.status === v} className={`rounded-full border px-3 py-1.5 text-xs ${c.status === v ? "border-ink bg-ink text-white" : "border-line bg-white hover:bg-mist"}`}>{l}</button>
            </form>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-medium">AI investigation</h2>
              <InvestigateButton caseId={id} hasResult={!!ai} />
            </div>
            {ai ? (
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <span className="badge bg-ink text-white">{ASSESS[ai.assessment]}</span>
                  <span className="badge bg-mist text-ink-soft">Suggested: {ACTION[ai.recommended_action]}</span>
                </div>
                <p className="leading-relaxed">{ai.summary}</p>
                <div><p className="label">Key indicators</p><ul className="list-disc space-y-1 pl-5">{ai.key_indicators.map((k, i) => <li key={i}>{k}</li>)}</ul></div>
                <div><p className="label">Suggested next steps</p><ul className="list-disc space-y-1 pl-5">{ai.next_steps.map((k, i) => <li key={i}>{k}</li>)}</ul></div>
                {ai.caveats.length > 0 && <div><p className="label">Caveats</p><ul className="list-disc space-y-1 pl-5 text-ink-soft">{ai.caveats.map((k, i) => <li key={i}>{k}</li>)}</ul></div>}
                <p className="text-xs text-ink-mute">AI-generated from this case&apos;s recorded evidence on {when(ai.generated_at)}. Advisory only. The risk score is computed by rules, not by AI.</p>
              </div>
            ) : <p className="text-sm text-ink-soft">Generate a structured summary and recommended next steps from the transaction, its risk signals and the customer&apos;s history.</p>}
          </section>

          <section className="card p-5">
            <h2 className="mb-4 text-base font-medium">Notes</h2>
            {notes?.length ? (
              <ul className="mb-4 space-y-3">
                {notes.map((n) => <li key={n.id} className="rounded-xl bg-mist/60 px-4 py-3 text-sm"><p className="whitespace-pre-wrap">{n.body}</p><p className="mt-1 text-xs text-ink-mute">{when(n.created_at)}</p></li>)}
              </ul>
            ) : <p className="mb-4 text-sm text-ink-soft">No notes yet.</p>}
            <ActionForm action={addCaseNote} reset>
              <input type="hidden" name="case_id" value={id} />
              <label htmlFor="body" className="label">Add a note</label>
              <textarea id="body" name="body" required maxLength={4000} rows={3} className="input" />
              <Submit className="btn-dark btn-sm">Save note</Submit>
            </ActionForm>
          </section>
        </div>

        <div className="space-y-6">
          {tx && (
            <section className="card p-5 text-sm">
              <h2 className="mb-3 text-base font-medium">Transaction</h2>
              <div className="mb-3 flex items-center justify-between"><span className="font-display text-xl">{money(tx.amount, tx.currency)}</span><DecisionBadge decision={tx.decision} /></div>
              <dl className="space-y-1 text-ink-soft">
                {[["Risk score", tx.risk_score], ["Channel", tx.channel], ["Customer", tx.customer_ref], ["Email", tx.email], ["IP", tx.ip && `${tx.ip}${tx.ip_country ? ` (${tx.ip_country})` : ""}`], ["Billing country", tx.billing_country], ["Device", tx.device_id]].map(([k, v]) => v ? (
                  <div key={k as string} className="flex justify-between gap-3"><dt>{k}</dt><dd className="break-all text-right text-ink">{v}</dd></div>
                ) : null)}
              </dl>
              <p className="label mt-4">Why this decision</p>
              <ReasonList reasons={tx.reasons as ReasonRow[]} />
            </section>
          )}
          {cust && (
            <section className="card p-5 text-sm">
              <h2 className="mb-3 text-base font-medium">Customer</h2>
              <div className="flex items-center justify-between"><span className="font-medium">{cust.name ?? cust.ref}</span><LevelBadge level={cust.risk_level} /></div>
              <p className="mt-1 text-ink-soft">Ref {cust.ref} · {cust.country ?? "country unknown"} · score {cust.risk_score}</p>
              {(cust.sanctions_hit || cust.is_pep) && <p className="mt-2 text-danger">{[cust.sanctions_hit && "Sanctions match", cust.is_pep && "PEP"].filter(Boolean).join(" · ")}</p>}
            </section>
          )}
        </div>
      </div>
    </>
  );
}
