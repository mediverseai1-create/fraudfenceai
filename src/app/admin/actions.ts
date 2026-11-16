"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/session";
import type { ActionState } from "@/components/forms";

/** Manual activation after you have verified a payment in the Selar dashboard. */
export async function activatePlan(_: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!isAdminEmail(data.user?.email)) return { error: "Not authorized." };

  const p = z.object({
    email: z.string().trim().toLowerCase().email(),
    plan: z.enum(["starter", "growth", "scale"]),
    days: z.coerce.number().int().min(1).max(366).default(30),
  }).safeParse(Object.fromEntries(form));
  if (!p.success) return { error: p.error.issues[0].message };

  const db = createAdminClient();
  const { data: profile } = await db.from("profiles").select("id").ilike("email", p.data.email).maybeSingle();
  if (!profile) return { error: "No account with that email." };
  const { data: member } = await db.from("members").select("org_id").eq("user_id", profile.id).limit(1).maybeSingle();
  if (!member) return { error: "Account has no organization." };

  const end = new Date(Date.now() + p.data.days * 86_400_000).toISOString();
  const { error } = await db.from("organizations").update({ plan: p.data.plan, plan_status: "active", current_period_end: end }).eq("id", member.org_id);
  if (error) return { error: error.message };
  await db.from("payments").insert({ org_id: member.org_id, email: p.data.email, plan: p.data.plan, status: "activated", raw: { manual: true, by: data.user?.id } });
  revalidatePath("/admin");
  return { ok: true, message: `Activated ${p.data.plan} for ${p.data.email} until ${end.slice(0, 10)}.` };
}
