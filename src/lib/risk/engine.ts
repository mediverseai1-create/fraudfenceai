import { DISPOSABLE_EMAIL_DOMAINS, ELEVATED_RISK_COUNTRIES, HIGH_RISK_COUNTRIES } from "./constants";

export type Decision = "approve" | "review" | "decline";

export interface TxInput {
  amount: number;
  currency?: string;
  channel: string;
  email?: string | null;
  ip?: string | null;
  ip_country?: string | null;
  billing_country?: string | null;
  device_id?: string | null;
  merchant?: string | null;
  customer_ref?: string | null;
  occurred_at?: string | null;
}

export interface RiskContext {
  customer: { avgAmount: number; txCount: number; ageDays: number; isPep: boolean; sanctionsHit: boolean } | null;
  count1h: number;
  count24h: number;
  sum24h: number;
  /** Other customers (excluding this one) seen on the same device. */
  deviceOtherCustomers: number;
  /** Other customers seen with the same email. */
  emailOtherCustomers: number;
  blocklist: { email: boolean; device: boolean; ip: boolean };
}

export interface CustomRule {
  id?: string;
  name: string;
  field: string;
  op: string;
  value: string;
  points: number;
  action: "flag" | "review" | "decline";
  enabled: boolean;
}

export interface Reason {
  code: string;
  label: string;
  points: number;
  source: "signal" | "rule";
}

export interface RiskResult {
  score: number;
  decision: Decision;
  reasons: Reason[];
}

export interface Thresholds {
  review: number;
  decline: number;
}

const upper = (s?: string | null) => (s ? s.trim().toUpperCase() : "");
export const emailDomain = (e?: string | null) => (e && e.includes("@") ? e.split("@").pop()!.trim().toLowerCase() : "");

export function fieldValue(field: string, tx: TxInput, ctx: RiskContext): string | number {
  const when = tx.occurred_at ? new Date(tx.occurred_at) : new Date();
  switch (field) {
    case "amount": return tx.amount;
    case "velocity_1h": return ctx.count1h + 1;
    case "velocity_24h": return ctx.count24h + 1;
    case "sum_24h": return ctx.sum24h + tx.amount;
    case "ip_country": return upper(tx.ip_country);
    case "billing_country": return upper(tx.billing_country);
    case "channel": return (tx.channel || "").toLowerCase();
    case "email_domain": return emailDomain(tx.email);
    case "merchant": return (tx.merchant || "").toLowerCase();
    case "hour_utc": return when.getUTCHours();
    default: return "";
  }
}

export function evalRule(rule: CustomRule, tx: TxInput, ctx: RiskContext): boolean {
  const actual = fieldValue(rule.field, tx, ctx);
  const raw = rule.value.trim();
  if (typeof actual === "number") {
    if (rule.op === "in") return raw.split(",").map((s) => Number(s.trim())).includes(actual);
    const target = Number(raw);
    if (raw === "" || Number.isNaN(target)) return false;
    switch (rule.op) {
      case "gt": return actual > target;
      case "gte": return actual >= target;
      case "lt": return actual < target;
      case "lte": return actual <= target;
      case "eq": return actual === target;
      case "neq": return actual !== target;
      default: return false;
    }
  }
  const a = String(actual).toLowerCase();
  const t = raw.toLowerCase();
  switch (rule.op) {
    case "eq": return a === t;
    case "neq": return a !== t;
    case "in": return t.split(",").map((s) => s.trim()).includes(a);
    case "contains": return t !== "" && a.includes(t);
    default: return false;
  }
}

export function scoreTransaction(
  tx: TxInput,
  ctx: RiskContext,
  rules: CustomRule[],
  thresholds: Thresholds = { review: 40, decline: 75 },
): RiskResult {
  const reasons: Reason[] = [];
  const add = (code: string, label: string, points: number) => reasons.push({ code, label, points, source: "signal" });

  // Hard blocks
  if (ctx.blocklist.email) add("blocklist_email", "Email is on your blocklist", 90);
  if (ctx.blocklist.device) add("blocklist_device", "Device is on your blocklist", 90);
  if (ctx.blocklist.ip) add("blocklist_ip", "IP address is on your blocklist", 90);
  if (ctx.customer?.sanctionsHit) add("sanctions_customer", "Customer has a sanctions screening hit", 80);

  // Geography
  const ipc = upper(tx.ip_country), bc = upper(tx.billing_country);
  if (HIGH_RISK_COUNTRIES.has(ipc) || HIGH_RISK_COUNTRIES.has(bc)) add("high_risk_country", "High-risk jurisdiction involved", 45);
  else if (ELEVATED_RISK_COUNTRIES.has(ipc) || ELEVATED_RISK_COUNTRIES.has(bc)) add("elevated_country", "Elevated-risk jurisdiction involved", 20);
  if (ipc && bc && ipc !== bc) add("geo_mismatch", `IP country (${ipc}) differs from billing country (${bc})`, 20);

  // Velocity (counts exclude this transaction, so +1 includes it)
  if (ctx.count1h + 1 >= 5) add("velocity_1h", `${ctx.count1h + 1} transactions in one hour`, 30);
  else if (ctx.count1h + 1 >= 3) add("velocity_1h_mild", `${ctx.count1h + 1} transactions in one hour`, 15);
  if (ctx.count24h + 1 >= 15) add("velocity_24h", `${ctx.count24h + 1} transactions in 24 hours`, 20);

  // Amount anomaly against the customer's own history (needs at least 3 prior transactions)
  const c = ctx.customer;
  if (c && c.txCount >= 3 && c.avgAmount > 0) {
    const ratio = tx.amount / c.avgAmount;
    if (ratio >= 10) add("amount_spike_10x", `Amount is ${ratio.toFixed(1)}x this customer's average`, 35);
    else if (ratio >= 4) add("amount_spike_4x", `Amount is ${ratio.toFixed(1)}x this customer's average`, 20);
  }
  if (!c || c.txCount === 0) {
    if (tx.amount >= 2000) add("large_first_tx", "Large first transaction for this customer", 20);
  }
  if (c && c.ageDays < 1 && tx.amount >= 1000) add("new_customer_large", "Customer created in the last 24h with a large transaction", 15);

  // Card-testing pattern: tiny amounts in rapid succession
  if (tx.amount > 0 && tx.amount < 2 && ctx.count1h >= 2) add("card_testing", "Repeated very small amounts (card-testing pattern)", 30);

  // Identity linkage
  if (ctx.deviceOtherCustomers >= 3) add("device_shared_many", `Device shared with ${ctx.deviceOtherCustomers} other customers`, 35);
  else if (ctx.deviceOtherCustomers >= 1) add("device_shared", `Device shared with ${ctx.deviceOtherCustomers} other customer(s)`, 15);
  if (ctx.emailOtherCustomers >= 1) add("email_shared", "Email used by a different customer record", 20);

  // Email quality
  const dom = emailDomain(tx.email);
  if (dom && DISPOSABLE_EMAIL_DOMAINS.has(dom)) add("disposable_email", "Disposable email domain", 25);

  // Context
  if (c?.isPep) add("pep", "Customer is a politically exposed person", 15);
  if (!tx.device_id) add("no_device", "No device identifier supplied", 5);
  if (tx.channel === "crypto" || tx.channel === "wire") add("channel_risk", `${tx.channel} payments are hard to reverse`, 8);
  const hour = (tx.occurred_at ? new Date(tx.occurred_at) : new Date()).getUTCHours();
  if (hour >= 1 && hour <= 4 && tx.amount >= 500) add("night_hours", "Large transaction in low-traffic hours (01-05 UTC)", 8);
  if (tx.amount >= 1000 && tx.amount % 1000 === 0) add("round_amount", "Large round-number amount", 6);

  // Custom rules
  let forced: Decision | null = null;
  for (const r of rules) {
    if (!r.enabled) continue;
    if (evalRule(r, tx, ctx)) {
      reasons.push({ code: `rule:${r.id ?? r.name}`, label: `Rule: ${r.name}`, points: r.points, source: "rule" });
      if (r.action === "decline") forced = "decline";
      else if (r.action === "review" && forced !== "decline") forced = "review";
    }
  }

  const score = Math.min(100, reasons.reduce((s, r) => s + r.points, 0));
  let decision: Decision = score >= thresholds.decline ? "decline" : score >= thresholds.review ? "review" : "approve";
  if (forced === "decline") decision = "decline";
  else if (forced === "review" && decision === "approve") decision = "review";

  reasons.sort((a, b) => b.points - a.points);
  return { score, decision, reasons };
}

// ---------- Customer risk rating ----------
export interface CustomerRiskInput {
  country?: string | null;
  isPep: boolean;
  sanctionsHit: boolean;
  txCount: number;
  declineCount: number;
  reviewCount: number;
}

export function rateCustomer(i: CustomerRiskInput): { score: number; level: "low" | "medium" | "high"; factors: string[] } {
  let score = 0;
  const factors: string[] = [];
  const cc = upper(i.country);
  if (HIGH_RISK_COUNTRIES.has(cc)) { score += 40; factors.push("High-risk jurisdiction"); }
  else if (ELEVATED_RISK_COUNTRIES.has(cc)) { score += 20; factors.push("Elevated-risk jurisdiction"); }
  if (i.sanctionsHit) { score += 60; factors.push("Sanctions screening hit"); }
  if (i.isPep) { score += 25; factors.push("Politically exposed person"); }
  if (i.txCount >= 3) {
    const bad = (i.declineCount * 2 + i.reviewCount) / i.txCount;
    if (bad >= 0.5) { score += 30; factors.push("Majority of transactions flagged"); }
    else if (bad >= 0.2) { score += 15; factors.push("Notable share of flagged transactions"); }
  }
  score = Math.min(100, score);
  return { score, level: score >= 60 ? "high" : score >= 30 ? "medium" : "low", factors };
}
