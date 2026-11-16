import type { Metadata } from "next";
import { requireOrg } from "@/lib/session";
import { ActionForm, Field, Submit } from "@/components/forms";
import { Empty, PageHeader } from "@/components/ui";
import { RULE_FIELDS, RULE_OPS, RULE_OP_LABEL } from "@/lib/risk/constants";
import { createRule, deleteRule, toggleRule } from "../actions";

export const metadata: Metadata = { title: "Rules" };

export default async function Rules() {
  const { supabase, org, billing } = await requireOrg();
  const { data: rules } = await supabase.from("rules").select("*").eq("org_id", org.id).order("created_at");
  const label = (id: string) => RULE_FIELDS.find((f) => f.id === id)?.label ?? id;

  return (
    <>
      <PageHeader title="Rules" subtitle={`Custom rules run on every screening, on top of built-in signals. ${rules?.length ?? 0} of ${billing.plan.rules} used.`} />
      <section className="card p-5">
        <h2 className="mb-4 text-base font-medium">New rule</h2>
        <ActionForm action={createRule} reset className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2"><Field label="Name" name="name" required placeholder="Large wire from new country" maxLength={80} /></div>
          <div>
            <label htmlFor="field" className="label">Field</label>
            <select id="field" name="field" className="input">{RULE_FIELDS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</select>
          </div>
          <div>
            <label htmlFor="op" className="label">Condition</label>
            <select id="op" name="op" className="input">{RULE_OPS.map((o) => <option key={o} value={o}>{RULE_OP_LABEL[o]}</option>)}</select>
          </div>
          <Field label="Value" name="value" required placeholder="5000 or NG,GH" hint="Comma list for “is one of”." />
          <Field label="Points (0-100)" name="points" type="number" min={0} max={100} defaultValue={20} required />
          <div>
            <label htmlFor="action" className="label">Action on match</label>
            <select id="action" name="action" className="input"><option value="flag">Add points only</option><option value="review">Force review</option><option value="decline">Force decline</option></select>
          </div>
          <div className="flex items-end"><Submit>Add rule</Submit></div>
        </ActionForm>
      </section>

      <section className="card mt-6 overflow-hidden">
        {rules?.length ? (
          <table className="w-full">
            <thead className="border-b border-line bg-mist/50"><tr><th className="th">Rule</th><th className="th">Condition</th><th className="th">Points</th><th className="th">Action</th><th className="th" /></tr></thead>
            <tbody className="divide-y divide-line">
              {rules.map((r) => (
                <tr key={r.id} className={r.enabled ? "" : "opacity-50"}>
                  <td className="td font-medium">{r.name}</td>
                  <td className="td text-ink-soft">{label(r.field)} {RULE_OP_LABEL[r.op]} {r.value}</td>
                  <td className="td">+{r.points}</td>
                  <td className="td capitalize">{r.action}</td>
                  <td className="td">
                    <div className="flex justify-end gap-3 text-xs">
                      <form action={toggleRule.bind(null, r.id, !r.enabled)}><button className="underline">{r.enabled ? "Disable" : "Enable"}</button></form>
                      <form action={deleteRule.bind(null, r.id)}><button className="text-danger underline">Delete</button></form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <Empty title="No custom rules yet" body="Built-in signals already run on every transaction. Add a rule to encode your own policy, such as declining wires over a set amount." />}
      </section>
    </>
  );
}
