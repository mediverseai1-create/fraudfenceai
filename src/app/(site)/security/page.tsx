import type { Metadata } from "next";
import { Cta, PageHero } from "@/components/cta";

export const metadata: Metadata = { title: "Security and governance" };

const sections = [
  { t: "Data isolation", items: ["Every organization's records are separated with row-level security enforced in the database, not only in application code.", "Queries are scoped to the signed-in organization on the server.", "The service-role key is used only in server-side routes and never reaches the browser."] },
  { t: "Authentication and access", items: ["Email and password sign-in with session handling on the server.", "Email confirmation and password reset through secure, expiring links.", "Protected routes redirect unauthenticated visitors to sign in."] },
  { t: "API security", items: ["API keys are shown once and stored only as SHA-256 hashes.", "Keys can be revoked at any time from Settings.", "Requests are validated on the server and rejected when malformed."] },
  { t: "Decision governance", items: ["Risk scores come from defined signals and your own rules, so identical inputs produce identical outputs.", "Each decision stores the list of signals and points behind it.", "AI output is limited to a fixed schema, drawn from recorded evidence and labeled as advisory."] },
  { t: "Billing integrity", items: ["Plan and subscription fields can only be changed by the verified billing system or an authorized administrator.", "Users cannot upgrade their own plan through the client.", "Payment events are logged for reconciliation."] },
];

export default function Security() {
  return (
    <>
      <PageHero title="Security and governance built into the platform" lead="Risk teams handle sensitive financial data. These are the controls that protect it and the practices that keep every decision defensible." />
      <div className="mx-auto grid max-w-6xl gap-5 px-5 py-16 md:grid-cols-2">
        {sections.map((s) => (
          <section key={s.t} className="card p-6">
            <h2 className="text-lg font-medium">{s.t}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-ink-soft">{s.items.map((i) => <li key={i}>{i}</li>)}</ul>
          </section>
        ))}
      </div>
      <Cta title="Evaluate the platform with your own data" />
    </>
  );
}
