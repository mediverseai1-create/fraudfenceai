import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { ResetForm } from "@/components/auth-form";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPage() {
  if (!supabaseConfigured()) redirect("/login?setup=1");
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?error=link-expired");
  return (
    <AuthShell title="Choose a new password">
      <ResetForm />
    </AuthShell>
  );
}
