import type { Metadata } from "next";
import { requireOrg } from "@/lib/session";
import { ActionForm, Field, Submit } from "@/components/forms";
import { PageHeader, when } from "@/components/ui";
import { createApiKey, revokeApiKey, updateSettings } from "../actions";

export const metadata: Metadata = { title: "Settings" };

export default async function Settings() {
  const { supabase, org, user, billing } = await requireOrg();
  const { data: keys } = await supabase.from("api_keys").select("id, name, key_prefix, last_used_at, created_at").eq("org_id", org.id).order("created_at");
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.com";

  return (
    <>
      <PageHeader title="Settings" subtitle="Organization, decision thresholds and API access." />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 text-base font-medium">Organization</h2>
          <ActionForm action={updateSettings}>
            <Field label="Organization name" name="name" defaultValue={org.name} required maxLength={120} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Review at score ≥" name="review_threshold" type="number" min={1} max={100} defaultValue={org.review_threshold} required />
              <Field label="Decline at score ≥" name="decline_threshold" type="number" min={1} max={100} defaultValue={org.decline_threshold} required />
            </div>
            <p className="text-xs text-ink-mute">Scores below the review threshold are approved. Custom rules can still force review or decline.</p>
            <Submit>Save settings</Submit>
          </ActionForm>
          <p className="mt-5 border-t border-line pt-4 text-xs text-ink-mute">Signed in as {user.email}</p>
        </section>

        <section className="card p-5">
          <h2 className="mb-1 text-base font-medium">API access</h2>
          {billing.active && billing.plan.apiAccess ? (
            <>
              <p className="mb-4 text-xs text-ink-mute">Screen transactions from your backend in real time. Keys are shown once and stored hashed.</p>
              <ActionForm action={createApiKey} reset className="flex flex-wrap items-end gap-3">
                <div className="min-w-[180px] flex-1"><Field label="Key name" name="name" placeholder="Production" required maxLength={60} /></div>
                <Submit>Create key</Submit>
              </ActionForm>
              {keys?.length ? (
                <ul className="mt-5 divide-y divide-line text-sm">
                  {keys.map((k) => (
                    <li key={k.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div><p className="font-medium">{k.name}</p><p className="text-xs text-ink-mute">{k.key_prefix}… · {k.last_used_at ? `used ${when(k.last_used_at)}` : "never used"}</p></div>
                      <form action={revokeApiKey.bind(null, k.id)}><button className="text-xs text-danger underline">Revoke</button></form>
                    </li>
                  ))}
                </ul>
              ) : null}
              <pre className="mt-5 overflow-x-auto rounded-xl bg-ink p-4 text-xs leading-relaxed text-white">{`curl -X POST ${base}/api/v1/screen \\
  -H "Authorization: Bearer ffk_..." \\
  -H "Content-Type: application/json" \\
  -d '{"amount": 250, "currency": "USD",
       "channel": "card", "customer_ref": "cus_1042",
       "email": "buyer@example.com", "device_id": "dev_8f2a",
       "ip_country": "US", "billing_country": "US"}'`}</pre>
            </>
          ) : (
            <p className="text-sm text-ink-soft">The REST API is included in the Growth and Scale plans. See Billing to upgrade.</p>
          )}
        </section>
      </div>
    </>
  );
}
