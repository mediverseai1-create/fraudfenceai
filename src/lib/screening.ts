import type { SupabaseClient } from "@supabase/supabase-js";
import { screenName, type WatchEntry } from "@/lib/risk/similarity";
import { refreshCustomerRisk } from "@/lib/pipeline";

export async function loadNameLists(db: SupabaseClient, orgId: string): Promise<WatchEntry[]> {
  const { data } = await db
    .from("watchlist_entries")
    .select("id, list_name, entry_type, value, country")
    .eq("org_id", orgId)
    .in("entry_type", ["sanctions", "pep"])
    .limit(50000);
  return (data ?? []) as WatchEntry[];
}

/** Screens one customer name against the org's lists and stores the resulting flags. */
export async function screenCustomer(db: SupabaseClient, orgId: string, customerId: string, name: string | null, lists?: WatchEntry[]) {
  if (!name) return { sanctions: false, pep: false };
  const entries = lists ?? (await loadNameLists(db, orgId));
  const hits = screenName(name, entries);
  const sanctions = hits.some((h) => h.entry.entry_type === "sanctions");
  const pepHit = hits.some((h) => h.entry.entry_type === "pep");
  const { data: cur } = await db.from("customers").select("is_pep").eq("id", customerId).eq("org_id", orgId).maybeSingle();
  await db.from("customers").update({ sanctions_hit: sanctions, is_pep: pepHit || (cur?.is_pep ?? false) }).eq("id", customerId).eq("org_id", orgId);
  await refreshCustomerRisk(db, orgId, customerId);
  return { sanctions, pep: pepHit };
}

export async function rescreenAll(db: SupabaseClient, orgId: string) {
  const lists = await loadNameLists(db, orgId);
  const { data } = await db.from("customers").select("id, name").eq("org_id", orgId).not("name", "is", null).limit(5000);
  let flagged = 0;
  for (const c of data ?? []) {
    const r = await screenCustomer(db, orgId, c.id, c.name, lists);
    if (r.sanctions) flagged++;
  }
  return { checked: data?.length ?? 0, flagged };
}
