import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { effectivePlan } from "@/lib/plans";
import { screenTransaction, screeningAllowance, type OrgForScreening } from "@/lib/pipeline";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const token = /^Bearer\s+(ffk_[a-f0-9]{48})$/.exec(req.headers.get("authorization") ?? "")?.[1];
  if (!token) return NextResponse.json({ error: "Missing or malformed API key" }, { status: 401 });

  let db;
  try {
    db = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Server is not configured" }, { status: 503 });
  }

  const hash = createHash("sha256").update(token).digest("hex");
  const { data: key } = await db.from("api_keys").select("id, org_id").eq("key_hash", hash).maybeSingle();
  if (!key) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

  const { data: org } = await db
    .from("organizations")
    .select("id, plan, plan_status, trial_ends_at, current_period_end, review_threshold, decline_threshold")
    .eq("id", key.org_id)
    .maybeSingle();
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 401 });

  const eff = effectivePlan(org);
  if (!eff.active) return NextResponse.json({ error: eff.reason }, { status: 402 });
  if (!eff.plan.apiAccess) return NextResponse.json({ error: "API access requires the Growth or Scale plan" }, { status: 403 });

  const allow = await screeningAllowance(db, org as OrgForScreening);
  if (!allow.ok) return NextResponse.json({ error: allow.error }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const out = await screenTransaction(db, org as OrgForScreening, body, "api");
  if (!out.ok) return NextResponse.json({ error: out.error }, { status: 422 });

  await db.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", key.id);
  return NextResponse.json({
    transaction_id: out.transactionId,
    case_id: out.caseId,
    decision: out.result.decision,
    risk_score: out.result.score,
    reasons: out.result.reasons.map((r) => ({ code: r.code, label: r.label, points: r.points })),
  });
}
