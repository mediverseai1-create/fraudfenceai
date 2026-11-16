import type { Metadata } from "next";
import Link from "next/link";
import { requireOrg } from "@/lib/session";
import { Empty, PageHeader, when } from "@/components/ui";

export const metadata: Metadata = { title: "Cases" };

const STATUS_LABEL: Record<string, string> = { open: "Open", investigating: "Investigating", resolved_fraud: "Resolved: fraud", resolved_legit: "Resolved: legitimate" };
const prio: Record<string, string> = { high: "bg-red-50 text-danger", medium: "bg-amber-50 text-warn", low: "bg-mist text-ink-soft" };

export default async function Cases({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const { supabase, org } = await requireOrg();
  let q = supabase.from("cases").select("id, title, status, priority, created_at, ai_summary").eq("org_id", org.id).order("created_at", { ascending: false }).limit(100);
  if (status === "active") q = q.in("status", ["open", "investigating"]);
  const { data: cases } = await q;

  return (
    <>
      <PageHeader title="Cases" subtitle="Review and decline decisions open a case automatically." />
      <div className="mb-3 flex gap-1.5 text-xs">
        {[["", "All"], ["active", "Active"]].map(([v, l]) => (
          <Link key={v} href={v ? `?status=${v}` : "/app/cases"} className={`rounded-full border px-3 py-1 ${(status ?? "") === v ? "border-ink bg-ink text-white" : "border-line bg-white"}`}>{l}</Link>
        ))}
      </div>
      <section className="card overflow-hidden">
        {cases?.length ? (
          <ul className="divide-y divide-line">
            {cases.map((c) => (
              <li key={c.id}>
                <Link href={`/app/cases/${c.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-mist/40">
                  <div>
                    <p className="font-medium">{c.title}</p>
                    <p className="text-xs text-ink-mute">{when(c.created_at)}{c.ai_summary ? " · AI summary available" : ""}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`badge capitalize ${prio[c.priority]}`}>{c.priority}</span>
                    <span className="badge bg-mist text-ink-soft">{STATUS_LABEL[c.status]}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : <Empty title="No cases" body="When a screened transaction needs review or is declined, a case is created here." />}
      </section>
    </>
  );
}
