import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { effectivePlan, type OrgBilling } from "@/lib/plans";

export interface Org extends OrgBilling {
  id: string;
  name: string;
  review_threshold: number;
  decline_threshold: number;
}

/** Resolves the signed-in user and their organization, or redirects to /login. */
export async function requireOrg() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");
  const { data: member } = await supabase
    .from("members")
    .select("role, organizations(*)")
    .eq("user_id", auth.user.id)
    .limit(1)
    .maybeSingle();
  const org = (member as unknown as { organizations: Org | null } | null)?.organizations;
  if (!org) redirect("/login?error=no-organization");
  return { supabase, user: auth.user, org, billing: effectivePlan(org) };
}

export const isAdminEmail = (email?: string | null) =>
  !!email &&
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
