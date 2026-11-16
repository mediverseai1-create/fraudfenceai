import type { Metadata } from "next";
import { requireOrg } from "@/lib/session";
import { ActionForm, Field, Submit } from "@/components/forms";
import { Empty, PageHeader } from "@/components/ui";
import { loadNameLists } from "@/lib/screening";
import { screenName } from "@/lib/risk/similarity";
import { addWatchlistEntry, deleteWatchlistEntry, importWatchlist, rescreenCustomers } from "../actions";

export const metadata: Metadata = { title: "Watchlists" };

const TYPES = [["sanctions", "Sanctions (names)"], ["pep", "PEP (names)"], ["email", "Blocked email"], ["device", "Blocked device"], ["ip", "Blocked IP"]];

export default async function Watchlists({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { supabase, org } = await requireOrg();
  const { data: entries, count } = await supabase.from("watchlist_entries").select("*", { count: "exact" }).eq("org_id", org.id).order("created_at", { ascending: false }).limit(100);
  const matches = q?.trim() ? screenName(q.trim().slice(0, 200), await loadNameLists(supabase, org.id), 0.8).slice(0, 10) : null;

  return (
    <>
      <PageHeader
        title="Watchlists and sanctions screening"
        subtitle="FraudFenceAI does not bundle government lists. Import your own sanctions or PEP exports (for example an OFAC SDN CSV) and internal blocklists."
        action={<form action={rescreenCustomers}><button className="btn-light btn-sm">Re-screen all customers</button></form>}
      />

      <section className="card p-5">
        <h2 className="mb-1 text-base font-medium">Screen a name</h2>
        <form method="get" className="mt-3 flex flex-wrap gap-3">
          <input name="q" defaultValue={q} placeholder="Full name to check" aria-label="Name to screen" className="input max-w-sm" />
          <button className="btn-dark btn-sm self-center">Check</button>
        </form>
        {matches && (
          <div className="mt-4 text-sm" role="status">
            {matches.length ? (
              <ul className="divide-y divide-line rounded-xl border border-line">
                {matches.map((m) => (
                  <li key={m.entry.id} className="flex justify-between gap-4 px-4 py-2.5">
                    <span><span className="font-medium">{m.entry.value}</span> <span className="text-ink-mute">· {m.entry.entry_type.toUpperCase()} · {m.entry.list_name}</span></span>
                    <span className="font-medium text-danger">{Math.round(m.score * 100)}% match</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-mint-deep">No matches at or above 80% similarity against your imported name lists.</p>}
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 text-base font-medium">Add an entry</h2>
          <ActionForm action={addWatchlistEntry} reset>
            <div>
              <label htmlFor="entry_type" className="label">Type</label>
              <select id="entry_type" name="entry_type" className="input">{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            </div>
            <Field label="Value" name="value" required placeholder="Name, email, device ID or IP" />
            <Field label="List name" name="list_name" defaultValue="Custom" />
            <Field label="Notes" name="notes" />
            <Submit>Add entry</Submit>
          </ActionForm>
        </section>
        <section className="card p-5">
          <h2 className="mb-1 text-base font-medium">Import a list (CSV)</h2>
          <p className="mb-4 text-xs text-ink-mute">Header row required. Use a <code>value</code> (or <code>name</code>) column; optional <code>country</code> and <code>notes</code>. Up to 10,000 rows.</p>
          <ActionForm action={importWatchlist} reset>
            <div>
              <label htmlFor="imp_type" className="label">Type</label>
              <select id="imp_type" name="entry_type" className="input">{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            </div>
            <Field label="List name" name="list_name" defaultValue="Imported" />
            <input type="file" name="file" accept=".csv,text/csv" required aria-label="CSV file" className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-mist file:px-4 file:py-2 file:text-sm file:font-medium" />
            <Submit pendingText="Importing…">Import</Submit>
          </ActionForm>
        </section>
      </div>

      <section className="card mt-6 overflow-hidden">
        <div className="px-5 py-4"><h2 className="text-base font-medium">Entries <span className="text-ink-mute">({count ?? 0})</span></h2></div>
        {entries?.length ? (
          <table className="w-full">
            <thead className="border-y border-line bg-mist/50"><tr><th className="th">Type</th><th className="th">Value</th><th className="th">List</th><th className="th" /></tr></thead>
            <tbody className="divide-y divide-line">
              {entries.map((e) => (
                <tr key={e.id}><td className="td uppercase text-xs">{e.entry_type}</td><td className="td break-all">{e.value}</td><td className="td text-ink-soft">{e.list_name}</td>
                  <td className="td text-right"><form action={deleteWatchlistEntry.bind(null, e.id)}><button className="text-xs text-danger underline">Remove</button></form></td></tr>
              ))}
            </tbody>
          </table>
        ) : <Empty title="No entries" body="Add or import entries to enable sanctions, PEP and blocklist checks." />}
      </section>
    </>
  );
}
