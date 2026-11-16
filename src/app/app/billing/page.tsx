import type { Metadata } from "next";
import { requireOrg } from "@/lib/session";
import { PricingGrid } from "@/components/pricing-grid";
import { Meter, PageHeader } from "@/components/ui";
import { monthStart } from "@/lib/plans";

export const metadata: Metadata = { title: "Billing" };

export default async function Billing() {
  const { supabase, org, user, billing } = await requireOrg();
  const [{ count: screened }, { count: ai }] = await Promise.all([
    supabase.from("transactions").select("id", { count: "exact", head: true }).eq("org_id", org.id).gte("created_at", monthStart()),
    supabase.from("usage_events").select("id", { count: "exact", head: true }).eq("org_id", org.id).eq("kind", "ai_investigation").gte("created_at", monthStart()),
  ]);
  const fmt = (s: string) => new Date(s).toLocaleDateString("en-US", { dateStyle: "medium" });
  const status = org.plan === "trial" ? (billing.active ? "Trial" : "Trial ended") : billing.active ? "Active" : org.plan_status.replace("_", " ");

  return (
    <>
      <PageHeader title="Billing" subtitle="Your plan, usage and available upgrades." />
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-1">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-mute">Current plan</p>
          <p className="mt-2 font-display text-3xl font-medium capitalize">{org.plan}</p>
          <p className="mt-1 text-sm capitalize text-ink-soft">Status: {status}</p>
          {org.plan === "trial" ? <p className="mt-1 text-sm text-ink-soft">Trial ends {fmt(org.trial_ends_at)}</p> : org.current_period_end && <p className="mt-1 text-sm text-ink-soft">Paid through {fmt(org.current_period_end)}</p>}
        </section>
        <section className="card space-y-4 p-5 lg:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-mute">Usage this month</p>
          <Meter label="Transaction screenings" used={screened ?? 0} limit={billing.plan.screenings} />
          <Meter label="AI investigations" used={ai ?? 0} limit={billing.plan.aiInvestigations} />
        </section>
      </div>

      <h2 className="mb-4 mt-10 text-xl font-medium">Plans</h2>
      <PricingGrid checkout current={org.plan === "trial" || !billing.active ? undefined : org.plan} />
      <div className="card mt-6 p-5 text-sm text-ink-soft">
        <p className="font-medium text-ink">How activation works</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Open the checkout for your plan and pay with <strong className="text-ink">{user.email}</strong>, the same email as this account.</li>
          <li>Your plan is activated when the payment is confirmed by our billing system. Returning from checkout does not activate it on its own.</li>
          <li>If it is not active after a few minutes, contact support with your payment receipt.</li>
        </ol>
        <p className="mt-3">To change plans, complete checkout for the new plan. Your limits update when that payment is confirmed. To cancel, contact support before your next renewal.</p>
      </div>
    </>
  );
}
