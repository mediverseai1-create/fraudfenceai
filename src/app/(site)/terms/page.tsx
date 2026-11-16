import type { Metadata } from "next";
import { Prose } from "@/components/cta";

export const metadata: Metadata = { title: "Terms of service" };

export default function Terms() {
  return (
    <Prose title="Terms of service" updated="November 2026">
      <p>These terms govern the use of FraudFenceAI by businesses and their authorized users.</p>
      <h2>The service</h2>
      <p>FraudFenceAI provides transaction screening, rules, customer risk rating, watchlist screening, case management and AI-assisted investigation. Features and limits depend on your plan.</p>
      <h2>Decision support, not advice</h2>
      <p>Risk scores, customer tiers and AI assessments are decision support. You remain responsible for your compliance obligations and for every decision you take. The platform does not provide legal or regulatory advice, and does not include government sanctions lists. You supply the lists you rely on.</p>
      <h2>Accounts and acceptable use</h2>
      <ul>
        <li>Keep your credentials and API keys confidential.</li>
        <li>Do not attempt to access other organizations&apos; data, disrupt the service or reverse engineer it.</li>
        <li>Use the platform only for lawful fraud prevention and compliance purposes.</li>
      </ul>
      <h2>Plans and payment</h2>
      <p>Paid plans are billed through our payment provider. A plan is activated after payment is confirmed. Usage limits reset each calendar month. If a subscription period ends without renewal, access to screening pauses until payment is received.</p>
      <h2>Your data</h2>
      <p>You own the data you submit. You grant us the right to process it to operate the service, as described in the privacy policy.</p>
      <h2>Availability and liability</h2>
      <p>We work to keep the service available but do not guarantee uninterrupted operation. To the extent permitted by law, our liability is limited to the fees you paid in the three months before the claim.</p>
      <h2>Termination</h2>
      <p>You may stop using the service at any time. We may suspend accounts that breach these terms.</p>
    </Prose>
  );
}
