import type { Metadata } from "next";
import { Prose } from "@/components/cta";

export const metadata: Metadata = { title: "Privacy policy" };

export default function Privacy() {
  return (
    <Prose title="Privacy policy" updated="November 2026">
      <p>This policy explains how FraudFenceAI collects and uses information when organizations use the platform.</p>
      <h2>Information we collect</h2>
      <ul>
        <li>Account information: name of the organization, email address and authentication data.</li>
        <li>Customer content: transactions, customer records, watchlist entries, rules and case notes that you submit to the platform.</li>
        <li>Usage and billing information: plan, usage counts and payment confirmations received from our payment provider.</li>
      </ul>
      <h2>How we use information</h2>
      <ul>
        <li>To provide screening, case management and AI investigation features.</li>
        <li>To secure accounts, prevent abuse and maintain the service.</li>
        <li>To manage plans, usage limits and billing.</li>
      </ul>
      <h2>AI processing</h2>
      <p>When you run an AI investigation, the evidence for that case is sent to our AI provider to generate the assessment. Only data tied to the case being investigated is included.</p>
      <h2>Data separation and retention</h2>
      <p>Each organization&apos;s data is isolated in the database. Data is retained while your account is active. You can ask us to delete your organization&apos;s data when you close your account.</p>
      <h2>Service providers</h2>
      <p>We use infrastructure, database, authentication, AI and payment providers to deliver the service. They process data only on our behalf.</p>
      <h2>Your responsibilities</h2>
      <p>As the customer, you decide what data to submit and are responsible for having a lawful basis to process it, including data about your own customers.</p>
      <h2>Changes</h2>
      <p>We will update this page when the policy changes and revise the date above.</p>
    </Prose>
  );
}
