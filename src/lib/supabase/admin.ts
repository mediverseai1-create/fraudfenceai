import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Service-role client. Bypasses RLS. Use only in trusted server code (webhook, admin, API-key routes). */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL not configured");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
