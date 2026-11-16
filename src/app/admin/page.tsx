import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/session";
import { ActionForm, Field, Submit } from "@/components/forms";
import { when } from "@/components/ui";
import { activatePlan } from "./actions";

export const metadata: Metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function Admin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/app");
  if (!isAdminEmail(data.user.email)) notFound();

  const db = createAdminClient();
  const { data: payments } = await db.from("payments").select("id, email, amount, plan, status, created_at").order("created_at", { ascending: false }).limit(50);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <Link href="/app" className="text-sm underline">← Back to app</Link>
      <h1 className="mt-3 text-2xl font-medium">Admin: payments and activation</h1>
      <section className="card mt-6 p-5">
        <h2 className="mb-1 text-base font-medium">Activate a plan manually</h2>
        <p className="mb-4 text-xs text-ink-mute">Use after confirming the payment in your Selar dashboard (for example when the webhook could not match the buyer).</p>
        <ActionForm action={activatePlan} className="grid gap-4 sm:grid-cols-4">
          <div className="sm:col-span-2"><Field label="Account email" name="email" type="email" required /></div>
          <div>
            <label htmlFor="plan" className="label">Plan</label>
            <select id="plan" name="plan" className="input"><option value="starter">Starter ($47)</option><option value="growth">Growth ($57)</option><option value="scale">Scale ($97)</option></select>
          </div>
          <Field label="Days" name="days" type="number" defaultValue={30} min={1} max={366} />
          <div><Submit>Activate</Submit></div>
        </ActionForm>
      </section>
      <section className="card mt-6 overflow-hidden">
        <h2 className="px-5 py-4 text-base font-medium">Recent payment events</h2>
        <table className="w-full">
          <thead className="border-y border-line bg-mist/50"><tr><th className="th">When</th><th className="th">Email</th><th className="th">Amount</th><th className="th">Plan</th><th className="th">Status</th></tr></thead>
          <tbody className="divide-y divide-line">
            {(payments ?? []).map((p) => (
              <tr key={p.id}><td className="td text-ink-mute">{when(p.created_at)}</td><td className="td">{p.email ?? "—"}</td><td className="td">{p.amount ?? "—"}</td><td className="td capitalize">{p.plan ?? "—"}</td><td className="td capitalize">{p.status}</td></tr>
            ))}
            {!payments?.length && <tr><td className="td text-ink-soft" colSpan={5}>No payment events yet.</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}
