import type { Metadata } from "next";
import { requireOrg } from "@/lib/session";
import { ActionForm, Field, Submit } from "@/components/forms";
import { Empty, LevelBadge, PageHeader } from "@/components/ui";
import { createCustomer } from "../actions";

export const metadata: Metadata = { title: "Customers" };

export default async function Customers() {
  const { supabase, org } = await requireOrg();
  const { data: customers } = await supabase.from("customers").select("*").eq("org_id", org.id).order("risk_score", { ascending: false }).limit(200);

  return (
    <>
      <PageHeader title="Customers" subtitle="Risk tiers combine jurisdiction, PEP status, sanctions hits and transaction behaviour. Customers also appear automatically when you screen with a customer reference." />
      <section className="card p-5">
        <h2 className="mb-4 text-base font-medium">Add and screen a customer</h2>
        <ActionForm action={createCustomer} reset className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Reference" name="ref" required placeholder="cus_1042" />
          <Field label="Full name" name="name" placeholder="Jane Doe" hint="Used for sanctions and PEP screening." />
          <Field label="Email" name="email" type="email" />
          <Field label="Country (ISO-2)" name="country" maxLength={2} placeholder="US" />
          <div className="flex items-end"><Submit>Add customer</Submit></div>
        </ActionForm>
      </section>
      <section className="card mt-6 overflow-hidden">
        {customers?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="border-b border-line bg-mist/50"><tr><th className="th">Reference</th><th className="th">Name</th><th className="th">Country</th><th className="th">Flags</th><th className="th">Score</th><th className="th">Tier</th></tr></thead>
              <tbody className="divide-y divide-line">
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td className="td font-medium">{c.ref}</td>
                    <td className="td">{c.name ?? "—"}</td>
                    <td className="td">{c.country ?? "—"}</td>
                    <td className="td text-xs">{[c.sanctions_hit && "Sanctions match", c.is_pep && "PEP"].filter(Boolean).join(", ") || "—"}</td>
                    <td className="td">{c.risk_score}</td>
                    <td className="td"><LevelBadge level={c.risk_level} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty title="No customers yet" body="Add a customer above, or screen a transaction with a customer reference." />}
      </section>
    </>
  );
}
