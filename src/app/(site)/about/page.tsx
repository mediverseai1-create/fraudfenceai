import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About and contact" };

export default function About() {
  const support = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  return (
    <div className="mx-auto max-w-3xl px-5 py-20">
      <h1 className="text-4xl font-medium sm:text-5xl">Risk tooling that small teams can actually run</h1>
      <div className="mt-8 space-y-5 text-ink-soft">
        <p>
          Enterprise fraud platforms are built for banks with large engineering and compliance departments. Most startups, merchants and payment
          companies need the same fundamentals, such as transaction scoring, watchlist checks and a place to work cases, without a six-figure contract.
        </p>
        <p>
          FraudFenceAI is designed around three principles. Scores come from transparent logic you can audit. AI is used to explain and
          accelerate investigations, never to invent numbers. And every customer&apos;s data stays isolated in their own organization.
        </p>
      </div>
      <div className="card mt-12 p-7">
        <h2 className="text-xl font-medium">Contact and support</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Questions about plans, payment confirmation or onboarding?{" "}
          {support ? (
            <>Email <a className="font-medium text-ink underline" href={`mailto:${support}`}>{support}</a>. </>
          ) : (
            <>Contact details are published here once the support address is configured. </>
          )}
          Include the email address of your FraudFenceAI account.
        </p>
        <Link href="/signup" className="btn-dark mt-5">Start free trial</Link>
      </div>
    </div>
  );
}
