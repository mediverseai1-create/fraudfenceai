import type { Metadata } from "next";
import Link from "next/link";
import { requireOrg } from "@/lib/session";
import { monthStart } from "@/lib/plans";
import { DecisionBadge, Empty, Meter, PageHeader, Stat, money, when } from "@/components/ui";

export const metadata: Metadata = { title: "Overview" };

export default async function Overview() {
  const { supabase, org, billing } = await requireOrg();
  const since = new Date(Date.now() - 14 * 86_400_000).toISOString();
  const [{ data: recent }, { count: openCases }, { count: highRisk }, { count: aiUsed }, { data: flagged }] = await Promise.all([
    supabase.from("transactions").select("decision, created_at").eq("org_id", org.id).gte("created_at", monthStart() < since ? monthStart() : since).limit(5000),
    supabase.from("cases").select("id", { count: "exact", head: true }).eq("org_id", org.id).in("status", ["open", "investigating"]),
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("org_id", org.id).eq("risk_level", "high"),
    supabase.from("usage_events").select("id", { count: "exact", head: true }).eq("org_id", org.id).eq("kind", "ai_investigation").gte("created_at", monthStart()),
    supabase.from("transactions").select("id, amount, currency, decision, risk_score, customer_ref, created_at").eq("org_id", org.id).neq("decision", "approve").order("created_at", { ascending: false }).limit(6),
  ]);

  const month = (recent ?? []).filter((t) => t.created_at >= monthStart());
  const by = (d: string) => month.filter((t) => t.decision === d).length;
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    const rows = (recent ?? []).filter((t) => t.created_at.slice(0, 10) === key);
    return { key, label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), total: rows.length, flagged: rows.filter((r) => r.decision !== "approve").length };
  });
  const max = Math.max(1, ...days.map((d) => d.total));

  return (
    <>
      <PageHeader title="Overview" subtitle={`Risk activity for ${org.name}`} action={<Link href="/app/transactions" className="btn-dark btn-sm">Screen a transaction</Link>} />
      {month.length === 0 && (
        <div className="card mb-6">
          <Empty title="No transactions screened yet" body="Screen your first transaction, or import a CSV, to see risk activity, cases and trends here." href="/app/transactions" cta="Screen your first transaction" />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Screened this month" value={month.length.toLocaleString()} />
        <Stat label="Declined" value={by("decline")} sub={`${by("review")} sent to review`} />
        <Stat label="Open cases" value={openCases ?? 0} />
        <Stat label="High-risk customers" value={highRisk ?? 0} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <h2 className="text-base font-medium">Last 14 days</h2>
          <p className="text-xs text-ink-mute">Screened transactions per day, flagged share highlighted.</p>
          <div className="mt-5 flex h-40 items-end gap-1.5" role="img" aria-label="Bar chart of transactions screened per day for the last 14 days">
            {days.map((d) => (
              <div key={d.key} className="flex h-full flex-1 flex-col justify-end" title={`${d.label}: ${d.total} screened, ${d.flagged} flagged`}>
                <div className="rounded-t bg-danger/80" style={{ height: `${(d.flagged / max) * 100}%` }} />
                <div className={`bg-ink/80 ${d.flagged ? "" : "rounded-t"}`} style={{ height: `${((d.total - d.flagged) / max) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-ink-mute"><span>{days[0].label}</span><span>{days[13].label}</span></div>
        </section>
        <section className="card space-y-4 p-5">
          <h2 className="text-base font-medium">Plan usage</h2>
          <Meter label="Screenings this month" used={month.length} limit={billing.plan.screenings} />
          <Meter label="AI investigations" used={aiUsed ?? 0} limit={billing.plan.aiInvestigations} />
          <Link href="/app/billing" className="btn-light btn-sm w-full">Manage plan</Link>
        </section>
      </div>

      <section className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4"><h2 className="text-base font-medium">Recently flagged</h2><Link href="/app/transactions" className="text-sm underline">All transactions</Link></div>
        {flagged?.length ? (
          <table className="w-full">
            <thead className="border-y border-line bg-mist/50"><tr><th className="th">Customer</th><th className="th">Amount</th><th className="th">Score</th><th className="th">Decision</th><th className="th">When</th></tr></thead>
            <tbody className="divide-y divide-line">
              {flagged.map((t) => (
                <tr key={t.id}><td className="td">{t.customer_ref ?? "-"}</td><td className="td">{money(t.amount, t.currency)}</td><td className="td">{t.risk_score}</td><td className="td"><DecisionBadge decision={t.decision} /></td><td className="td text-ink-mute">{when(t.created_at)}</td></tr>
              ))}
            </tbody>
          </table>
        ) : <Empty title="Nothing flagged" body="Review and decline decisions will appear here." />}
      </section>
    </>
  );
}
