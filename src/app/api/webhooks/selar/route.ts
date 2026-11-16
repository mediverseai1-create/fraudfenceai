import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS, planFromAmount } from "@/lib/plans";

export const runtime = "nodejs";

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Walks a payload looking for the first string/number under any of the candidate keys. */
function pick(obj: unknown, keys: string[], depth = 0): unknown {
  if (!obj || typeof obj !== "object" || depth > 4) return undefined;
  const o = obj as Record<string, unknown>;
  for (const k of keys) if (o[k] !== undefined && o[k] !== null && typeof o[k] !== "object") return o[k];
  for (const v of Object.values(o)) {
    const r = pick(v, keys, depth + 1);
    if (r !== undefined) return r;
  }
  return undefined;
}

/**
 * Payment confirmation webhook.
 * Authenticated by a shared secret (header x-webhook-secret or ?token=).
 * Configure the same secret in SELAR_WEBHOOK_SECRET and in the webhook URL/headers at the payment provider.
 * The payload field names below are best-effort; confirm them against a real Selar test event and
 * adjust `pick` keys if needed. Unmatched payments are stored for manual activation in /admin.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.SELAR_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  const provided = req.headers.get("x-webhook-secret") ?? req.nextUrl.searchParams.get("token") ?? "";
  if (!safeEqual(provided, secret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = String(pick(payload, ["customer_email", "buyer_email", "email"]) ?? "").trim().toLowerCase();
  const amount = Number(pick(payload, ["amount", "price", "total", "amount_paid"]));
  const plan = Number.isFinite(amount) ? planFromAmount(amount) : null;

  const db = createAdminClient();
  const { data: profile } = email ? await db.from("profiles").select("id").ilike("email", email).maybeSingle() : { data: null };
  const { data: member } = profile ? await db.from("members").select("org_id").eq("user_id", profile.id).limit(1).maybeSingle() : { data: null };

  if (!plan || !member) {
    await db.from("payments").insert({ email: email || null, amount: Number.isFinite(amount) ? amount : null, plan, status: "unmatched", raw: payload as object });
    return NextResponse.json({ received: true, activated: false });
  }

  const { data: org } = await db.from("organizations").select("current_period_end").eq("id", member.org_id).single();
  const base = org?.current_period_end && new Date(org.current_period_end) > new Date() ? new Date(org.current_period_end) : new Date();
  const end = new Date(base.getTime() + 30 * 86_400_000).toISOString();

  await db.from("organizations").update({ plan, plan_status: "active", current_period_end: end }).eq("id", member.org_id);
  await db.from("payments").insert({ org_id: member.org_id, email, amount, plan, status: "activated", raw: payload as object });
  return NextResponse.json({ received: true, activated: true, plan: PLANS[plan].name });
}
