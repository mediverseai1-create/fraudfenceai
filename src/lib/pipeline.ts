import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { CHANNELS } from "@/lib/risk/constants";
import { rateCustomer, scoreTransaction, type CustomRule, type RiskContext, type RiskResult, type TxInput } from "@/lib/risk/engine";
import { effectivePlan, monthStart, type OrgBilling } from "@/lib/plans";

const country = z.string().trim().length(2).transform((s) => s.toUpperCase());
const opt = <T extends z.ZodTypeAny>(s: T) => z.preprocess((v) => (v === "" || v === null ? undefined : v), s.optional());

export const txSchema = z.object({
  amount: z.coerce.number().finite().min(0).max(1_000_000_000),
  currency: opt(z.string().trim().length(3).transform((s) => s.toUpperCase())),
  channel: z.enum(CHANNELS).default("card"),
  customer_ref: opt(z.string().trim().min(1).max(120)),
  email: opt(z.string().trim().email().max(200)),
  ip: opt(z.string().trim().max(64)),
  ip_country: opt(country),
  billing_country: opt(country),
  device_id: opt(z.string().trim().max(200)),
  merchant: opt(z.string().trim().max(200)),
  occurred_at: opt(z.string().datetime({ offset: true })),
});
export type TxPayload = z.infer<typeof txSchema>;

export interface OrgForScreening extends OrgBilling {
  id: string;
  review_threshold: number;
  decline_threshold: number;
}

export type ScreenOutcome =
  | { ok: true; transactionId: string; caseId: string | null; result: RiskResult }
  | { ok: false; error: string };

export async function screeningsUsed(db: SupabaseClient, orgId: string): Promise<number> {
  const { count } = await db
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .gte("created_at", monthStart());
  return count ?? 0;
}

export async function screeningAllowance(db: SupabaseClient, org: OrgForScreening) {
  const eff = effectivePlan(org);
  if (!eff.active) return { ok: false as const, error: eff.reason ?? "Plan inactive", remaining: 0 };
  const used = await screeningsUsed(db, org.id);
  const remaining = Math.max(0, eff.plan.screenings - used);
  if (remaining === 0) return { ok: false as const, error: `Monthly limit of ${eff.plan.screenings} screenings reached. Upgrade to continue.`, remaining };
  return { ok: true as const, remaining };
}

const lc = (s?: string | null) => (s ? s.trim().toLowerCase() : null);

async function buildContext(db: SupabaseClient, orgId: string, tx: TxPayload): Promise<{ ctx: RiskContext; customerId: string | null }> {
  const at = tx.occurred_at ? new Date(tx.occurred_at) : new Date();
  const dayAgo = new Date(at.getTime() - 24 * 3600_000).toISOString();
  const hourAgo = at.getTime() - 3600_000;

  let customer: RiskContext["customer"] = null;
  let customerId: string | null = null;
  let count1h = 0, count24h = 0, sum24h = 0;

  if (tx.customer_ref) {
    const { data: c } = await db
      .from("customers")
      .select("id, is_pep, sanctions_hit, created_at")
      .eq("org_id", orgId)
      .eq("ref", tx.customer_ref)
      .maybeSingle();
    const { data: hist } = await db
      .from("transactions")
      .select("amount, occurred_at")
      .eq("org_id", orgId)
      .eq("customer_ref", tx.customer_ref)
      .lt("occurred_at", at.toISOString())
      .order("occurred_at", { ascending: false })
      .limit(200);
    const rows = hist ?? [];
    for (const r of rows) {
      const t = new Date(r.occurred_at).getTime();
      if (r.occurred_at >= dayAgo) { count24h++; sum24h += Number(r.amount); }
      if (t >= hourAgo) count1h++;
    }
    const total = rows.reduce((s, r) => s + Number(r.amount), 0);
    if (c) {
      customerId = c.id;
      customer = {
        avgAmount: rows.length ? total / rows.length : 0,
        txCount: rows.length,
        ageDays: (at.getTime() - new Date(c.created_at).getTime()) / 86_400_000,
        isPep: c.is_pep,
        sanctionsHit: c.sanctions_hit,
      };
    }
  }

  let deviceOthers = 0, emailOthers = 0;
  if (tx.device_id) {
    const { data } = await db.from("transactions").select("customer_ref").eq("org_id", orgId).eq("device_id", tx.device_id).not("customer_ref", "is", null).limit(200);
    deviceOthers = new Set((data ?? []).map((r) => r.customer_ref).filter((r) => r && r !== tx.customer_ref)).size;
  }
  if (tx.email) {
    const { data } = await db.from("transactions").select("customer_ref").eq("org_id", orgId).ilike("email", tx.email).not("customer_ref", "is", null).limit(200);
    emailOthers = new Set((data ?? []).map((r) => r.customer_ref).filter((r) => r && r !== tx.customer_ref)).size;
  }

  const probes = [lc(tx.email), tx.device_id, tx.ip].filter(Boolean) as string[];
  const blocklist = { email: false, device: false, ip: false };
  if (probes.length) {
    const { data } = await db
      .from("watchlist_entries")
      .select("entry_type, value")
      .eq("org_id", orgId)
      .in("entry_type", ["email", "device", "ip"])
      .in("value", [...new Set(probes.flatMap((p) => [p, p.toLowerCase()]))]);
    for (const e of data ?? []) {
      if (e.entry_type === "email" && e.value === lc(tx.email)) blocklist.email = true;
      if (e.entry_type === "device" && e.value === tx.device_id) blocklist.device = true;
      if (e.entry_type === "ip" && e.value === tx.ip) blocklist.ip = true;
    }
  }

  return { ctx: { customer, count1h, count24h, sum24h, deviceOtherCustomers: deviceOthers, emailOtherCustomers: emailOthers, blocklist }, customerId };
}

/** Recomputes and stores a customer's risk rating from their transaction history. */
export async function refreshCustomerRisk(db: SupabaseClient, orgId: string, customerId: string) {
  const { data: c } = await db.from("customers").select("id, ref, country, is_pep, sanctions_hit").eq("id", customerId).eq("org_id", orgId).maybeSingle();
  if (!c) return;
  const { data: txs } = await db.from("transactions").select("decision").eq("org_id", orgId).eq("customer_ref", c.ref).limit(1000);
  const rows = txs ?? [];
  const r = rateCustomer({
    country: c.country,
    isPep: c.is_pep,
    sanctionsHit: c.sanctions_hit,
    txCount: rows.length,
    declineCount: rows.filter((t) => t.decision === "decline").length,
    reviewCount: rows.filter((t) => t.decision === "review").length,
  });
  await db.from("customers").update({ risk_score: r.score, risk_level: r.level }).eq("id", customerId).eq("org_id", orgId);
}

/** Validates, scores, stores and (when flagged) opens a case. Quota must be checked by the caller. */
export async function screenTransaction(
  db: SupabaseClient,
  org: OrgForScreening,
  raw: unknown,
  source: "dashboard" | "csv" | "api",
  rulesCache?: CustomRule[],
): Promise<ScreenOutcome> {
  const parsed = txSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  const tx = parsed.data;

  const rules =
    rulesCache ??
    (((await db.from("rules").select("id, name, field, op, value, points, action, enabled").eq("org_id", org.id).eq("enabled", true)).data ?? []) as CustomRule[]);

  // Ensure a customer record exists so history and risk rating accumulate.
  let customerId: string | null = null;
  if (tx.customer_ref) {
    const { data: existing } = await db.from("customers").select("id").eq("org_id", org.id).eq("ref", tx.customer_ref).maybeSingle();
    if (existing) customerId = existing.id;
    else {
      const { data: created } = await db
        .from("customers")
        .insert({ org_id: org.id, ref: tx.customer_ref, email: tx.email ?? null, country: tx.billing_country ?? null })
        .select("id")
        .single();
      customerId = created?.id ?? null;
    }
  }

  const { ctx } = await buildContext(db, org.id, tx);
  const input: TxInput = { ...tx, occurred_at: tx.occurred_at ?? null };
  const result = scoreTransaction(input, ctx, rules, { review: org.review_threshold, decline: org.decline_threshold });

  const { data: row, error } = await db
    .from("transactions")
    .insert({
      org_id: org.id,
      customer_id: customerId,
      customer_ref: tx.customer_ref ?? null,
      amount: tx.amount,
      currency: tx.currency ?? "USD",
      channel: tx.channel,
      email: tx.email ?? null,
      ip: tx.ip ?? null,
      ip_country: tx.ip_country ?? null,
      billing_country: tx.billing_country ?? null,
      device_id: tx.device_id ?? null,
      merchant: tx.merchant ?? null,
      occurred_at: tx.occurred_at ?? new Date().toISOString(),
      risk_score: result.score,
      decision: result.decision,
      reasons: result.reasons,
      source,
    })
    .select("id")
    .single();
  if (error || !row) return { ok: false, error: error?.message ?? "Could not save transaction" };

  let caseId: string | null = null;
  if (result.decision !== "approve") {
    const { data: c } = await db
      .from("cases")
      .insert({
        org_id: org.id,
        transaction_id: row.id,
        customer_id: customerId,
        title: `${result.decision === "decline" ? "Declined" : "Review"}: ${tx.currency ?? "USD"} ${tx.amount.toFixed(2)}${tx.customer_ref ? ` · ${tx.customer_ref}` : ""}`,
        priority: result.score >= org.decline_threshold ? "high" : result.score >= 55 ? "medium" : "low",
      })
      .select("id")
      .single();
    caseId = c?.id ?? null;
  }
  if (customerId) await refreshCustomerRisk(db, org.id, customerId);
  return { ok: true, transactionId: row.id, caseId, result };
}
