"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrg } from "@/lib/session";
import { monthStart } from "@/lib/plans";
import { screenTransaction, screeningAllowance } from "@/lib/pipeline";
import { RULE_FIELD_IDS, RULE_OPS } from "@/lib/risk/constants";
import { parseCsv } from "@/lib/csv";
import { rescreenAll, screenCustomer } from "@/lib/screening";
import { AiError, investigate } from "@/lib/ai/gemini";
import type { CustomRule } from "@/lib/risk/engine";

export interface ActionState { error?: string; message?: string; ok?: boolean }
const fail = (error: string): ActionState => ({ error });
const done = (message: string): ActionState => ({ ok: true, message });
const formObj = (f: FormData) => Object.fromEntries([...f.entries()].filter(([, v]) => typeof v === "string"));
const firstIssue = (e: z.ZodError) => `${e.issues[0].path.join(".") || "input"}: ${e.issues[0].message}`;
const MAX_UPLOAD = 2 * 1024 * 1024;

// ---------- Screening ----------
export async function screenOne(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, org } = await requireOrg();
  const allow = await screeningAllowance(supabase, org);
  if (!allow.ok) return fail(allow.error);
  const out = await screenTransaction(supabase, org, formObj(form), "dashboard");
  if (!out.ok) return fail(out.error);
  revalidatePath("/app", "layout");
  const top = out.result.reasons[0]?.label;
  return done(`${out.result.decision.toUpperCase()} · score ${out.result.score}${top ? ` · ${top}` : ""}${out.caseId ? " · case opened" : ""}`);
}

export async function importTransactions(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, org } = await requireOrg();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return fail("Choose a CSV file.");
  if (file.size > MAX_UPLOAD) return fail("File is larger than 2 MB.");
  const rows = parseCsv(await file.text());
  if (!rows.length) return fail("No data rows found. The first row must be a header.");
  if (rows.length > 200) return fail("Import up to 200 rows at a time.");

  const allow = await screeningAllowance(supabase, org);
  if (!allow.ok) return fail(allow.error);
  const batch = rows.slice(0, allow.remaining);

  const { data: rules } = await supabase.from("rules").select("id, name, field, op, value, points, action, enabled").eq("org_id", org.id).eq("enabled", true);
  const counts = { approve: 0, review: 0, decline: 0 };
  const errors: string[] = [];
  for (const [i, r] of batch.entries()) {
    const out = await screenTransaction(supabase, org, r, "csv", (rules ?? []) as CustomRule[]);
    if (out.ok) counts[out.result.decision]++;
    else if (errors.length < 3) errors.push(`row ${i + 2}: ${out.error}`);
  }
  revalidatePath("/app", "layout");
  const processed = counts.approve + counts.review + counts.decline;
  const skipped = rows.length - processed;
  const msg = `Screened ${processed}: ${counts.approve} approved, ${counts.review} review, ${counts.decline} declined.`;
  if (skipped) return { ok: processed > 0, message: processed ? msg : undefined, error: `${skipped} row(s) not screened${rows.length > batch.length ? " (monthly limit reached)" : ""}. ${errors.join(" | ")}` };
  return done(msg);
}

// ---------- Rules ----------
const ruleSchema = z.object({
  name: z.string().trim().min(1).max(80),
  field: z.enum(RULE_FIELD_IDS),
  op: z.enum(RULE_OPS),
  value: z.string().trim().min(1).max(200),
  points: z.coerce.number().int().min(0).max(100),
  action: z.enum(["flag", "review", "decline"]),
});

export async function createRule(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, org, billing } = await requireOrg();
  const p = ruleSchema.safeParse(formObj(form));
  if (!p.success) return fail(firstIssue(p.error));
  const { count } = await supabase.from("rules").select("id", { count: "exact", head: true }).eq("org_id", org.id);
  if ((count ?? 0) >= billing.plan.rules) return fail(`Your ${billing.plan.name} plan allows ${billing.plan.rules} rules. Upgrade to add more.`);
  const { error } = await supabase.from("rules").insert({ ...p.data, org_id: org.id });
  if (error) return fail(error.message);
  revalidatePath("/app/rules");
  return done("Rule created.");
}

export async function toggleRule(id: string, enabled: boolean) {
  const { supabase, org } = await requireOrg();
  z.string().uuid().parse(id);
  await supabase.from("rules").update({ enabled }).eq("id", id).eq("org_id", org.id);
  revalidatePath("/app/rules");
}

export async function deleteRule(id: string) {
  const { supabase, org } = await requireOrg();
  z.string().uuid().parse(id);
  await supabase.from("rules").delete().eq("id", id).eq("org_id", org.id);
  revalidatePath("/app/rules");
}

// ---------- Customers & watchlists ----------
export async function createCustomer(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, org } = await requireOrg();
  const p = z.object({
    ref: z.string().trim().min(1).max(120),
    name: z.string().trim().max(200).optional(),
    email: z.string().trim().email().max(200).optional().or(z.literal("")),
    country: z.string().trim().length(2).transform((s) => s.toUpperCase()).optional().or(z.literal("")),
  }).safeParse(formObj(form));
  if (!p.success) return fail(firstIssue(p.error));
  const { data, error } = await supabase
    .from("customers")
    .insert({ org_id: org.id, ref: p.data.ref, name: p.data.name || null, email: p.data.email || null, country: p.data.country || null })
    .select("id")
    .single();
  if (error) return fail(error.code === "23505" ? "A customer with that reference already exists." : error.message);
  const r = await screenCustomer(supabase, org.id, data.id, p.data.name || null);
  revalidatePath("/app/customers");
  return done(r.sanctions ? "Customer added. Sanctions match found: review required." : "Customer added and screened.");
}

const entryType = z.enum(["sanctions", "pep", "email", "device", "ip"]);

export async function addWatchlistEntry(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, org } = await requireOrg();
  const p = z.object({
    entry_type: entryType,
    value: z.string().trim().min(1).max(300),
    list_name: z.string().trim().max(80).default("Custom"),
    country: z.string().trim().max(2).optional(),
    notes: z.string().trim().max(500).optional(),
  }).safeParse(formObj(form));
  if (!p.success) return fail(firstIssue(p.error));
  const value = ["email", "ip", "device"].includes(p.data.entry_type) ? p.data.value.toLowerCase() : p.data.value;
  const { error } = await supabase.from("watchlist_entries").insert({ ...p.data, value, list_name: p.data.list_name || "Custom", country: p.data.country || null, notes: p.data.notes || null, org_id: org.id });
  if (error) return fail(error.message);
  revalidatePath("/app/watchlists");
  return done("Entry added. Run “Re-screen customers” to apply name lists to existing customers.");
}

export async function importWatchlist(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, org } = await requireOrg();
  const type = entryType.safeParse(form.get("entry_type"));
  const listName = String(form.get("list_name") || "Imported").slice(0, 80);
  const file = form.get("file");
  if (!type.success) return fail("Choose a list type.");
  if (!(file instanceof File) || file.size === 0) return fail("Choose a CSV file.");
  if (file.size > MAX_UPLOAD) return fail("File is larger than 2 MB.");
  const rows = parseCsv(await file.text());
  if (!rows.length) return fail("No rows found. The CSV needs a header row with a 'value' (or 'name') column.");
  if (rows.length > 10000) return fail("Import up to 10,000 entries at a time.");
  const lower = ["email", "ip", "device"].includes(type.data);
  const insert = rows
    .map((r) => ({ v: (r.value || r.name || "").trim(), c: (r.country || "").trim().slice(0, 2).toUpperCase(), n: (r.notes || "").slice(0, 500) }))
    .filter((r) => r.v)
    .map((r) => ({ org_id: org.id, entry_type: type.data, list_name: listName, value: lower ? r.v.toLowerCase() : r.v.slice(0, 300), country: r.c || null, notes: r.n || null }));
  if (!insert.length) return fail("No usable rows. Expected a 'value' or 'name' column.");
  for (let i = 0; i < insert.length; i += 500) {
    const { error } = await supabase.from("watchlist_entries").insert(insert.slice(i, i + 500));
    if (error) return fail(error.message);
  }
  revalidatePath("/app/watchlists");
  return done(`Imported ${insert.length} entries.`);
}

export async function deleteWatchlistEntry(id: string) {
  const { supabase, org } = await requireOrg();
  z.string().uuid().parse(id);
  await supabase.from("watchlist_entries").delete().eq("id", id).eq("org_id", org.id);
  revalidatePath("/app/watchlists");
}

export async function rescreenCustomers(): Promise<void> {
  const { supabase, org } = await requireOrg();
  await rescreenAll(supabase, org.id);
  revalidatePath("/app", "layout");
}

// ---------- Cases ----------
export async function setCaseStatus(id: string, status: string) {
  const { supabase, org } = await requireOrg();
  const s = z.enum(["open", "investigating", "resolved_fraud", "resolved_legit"]).parse(status);
  z.string().uuid().parse(id);
  await supabase.from("cases").update({ status: s, updated_at: new Date().toISOString() }).eq("id", id).eq("org_id", org.id);
  revalidatePath("/app/cases", "layout");
}

export async function addCaseNote(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, org, user } = await requireOrg();
  const p = z.object({ case_id: z.string().uuid(), body: z.string().trim().min(1).max(4000) }).safeParse(formObj(form));
  if (!p.success) return fail(firstIssue(p.error));
  const { error } = await supabase.from("case_notes").insert({ ...p.data, org_id: org.id, author_id: user.id });
  if (error) return fail(error.message);
  revalidatePath(`/app/cases/${p.data.case_id}`);
  return done("Note added.");
}

export async function runInvestigation(caseId: string): Promise<ActionState> {
  const { supabase, org, billing } = await requireOrg();
  z.string().uuid().parse(caseId);
  if (!billing.active) return fail(billing.reason ?? "Plan inactive");

  const { count: used } = await supabase
    .from("usage_events").select("id", { count: "exact", head: true })
    .eq("org_id", org.id).eq("kind", "ai_investigation").gte("created_at", monthStart());
  if ((used ?? 0) >= billing.plan.aiInvestigations) return fail(`Monthly AI limit of ${billing.plan.aiInvestigations} investigations reached.`);

  const { data: c } = await supabase.from("cases").select("id, title, transaction_id, customer_id").eq("id", caseId).eq("org_id", org.id).maybeSingle();
  if (!c) return fail("Case not found.");
  const { data: tx } = c.transaction_id ? await supabase.from("transactions").select("*").eq("id", c.transaction_id).eq("org_id", org.id).maybeSingle() : { data: null };
  const { data: cust } = c.customer_id ? await supabase.from("customers").select("ref, name, country, is_pep, sanctions_hit, risk_score, risk_level, created_at").eq("id", c.customer_id).eq("org_id", org.id).maybeSingle() : { data: null };
  const { data: history } = tx?.customer_ref
    ? await supabase.from("transactions").select("amount, currency, decision, risk_score, channel, ip_country, occurred_at").eq("org_id", org.id).eq("customer_ref", tx.customer_ref).order("occurred_at", { ascending: false }).limit(15)
    : { data: [] };
  const { data: notes } = await supabase.from("case_notes").select("body").eq("case_id", caseId).eq("org_id", org.id).order("created_at").limit(10);

  const evidence = {
    case_title: c.title,
    transaction: tx && { amount: tx.amount, currency: tx.currency, channel: tx.channel, ip_country: tx.ip_country, billing_country: tx.billing_country, merchant: tx.merchant, occurred_at: tx.occurred_at, has_device_id: !!tx.device_id },
    system_decision: tx && { decision: tx.decision, risk_score: tx.risk_score, contributing_signals: tx.reasons },
    customer: cust,
    recent_customer_history: history,
    analyst_notes: (notes ?? []).map((n) => n.body),
  };
  if (!tx && !cust) return fail("This case has no linked transaction or customer to analyse.");

  try {
    const result = await investigate(evidence);
    await supabase.from("usage_events").insert({ org_id: org.id, kind: "ai_investigation" });
    await supabase.from("cases").update({ ai_summary: { ...result, generated_at: new Date().toISOString() }, updated_at: new Date().toISOString() }).eq("id", caseId).eq("org_id", org.id);
    revalidatePath(`/app/cases/${caseId}`);
    return done("Investigation complete.");
  } catch (e) {
    return fail(e instanceof AiError ? e.message : "AI investigation failed.");
  }
}

// ---------- Settings & API keys ----------
export async function updateSettings(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, org } = await requireOrg();
  const p = z.object({
    name: z.string().trim().min(1).max(120),
    review_threshold: z.coerce.number().int().min(1).max(100),
    decline_threshold: z.coerce.number().int().min(1).max(100),
  }).refine((v) => v.decline_threshold > v.review_threshold, { message: "Decline threshold must be higher than review threshold" }).safeParse(formObj(form));
  if (!p.success) return fail(firstIssue(p.error));
  const { error } = await supabase.from("organizations").update(p.data).eq("id", org.id);
  if (error) return fail(error.message);
  revalidatePath("/app", "layout");
  return done("Settings saved.");
}

export async function createApiKey(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, org, billing } = await requireOrg();
  if (!billing.active || !billing.plan.apiAccess) return fail("API access is included in the Growth and Scale plans.");
  const name = z.string().trim().min(1).max(60).safeParse(form.get("name"));
  if (!name.success) return fail("Give the key a name.");
  const { count } = await supabase.from("api_keys").select("id", { count: "exact", head: true }).eq("org_id", org.id);
  if ((count ?? 0) >= 5) return fail("You can have up to 5 API keys. Revoke one first.");
  const key = `ffk_${randomBytes(24).toString("hex")}`;
  const { error } = await supabase.from("api_keys").insert({ org_id: org.id, name: name.data, key_prefix: key.slice(0, 8), key_hash: createHash("sha256").update(key).digest("hex") });
  if (error) return fail(error.message);
  revalidatePath("/app/settings");
  return done(`Copy your key now, it will not be shown again: ${key}`);
}

export async function revokeApiKey(id: string) {
  const { supabase, org } = await requireOrg();
  z.string().uuid().parse(id);
  await supabase.from("api_keys").delete().eq("id", id).eq("org_id", org.id);
  revalidatePath("/app/settings");
}
