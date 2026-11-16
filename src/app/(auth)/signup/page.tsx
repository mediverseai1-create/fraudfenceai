import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { SignupForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Sign up" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  return (
    <AuthShell
      title="Create your account"
      subtitle="14-day trial with 100 screenings and 5 AI investigations. No card required."
      footer={<>Already have an account? <Link href="/login" className="font-medium text-ink underline">Log in</Link></>}
    >
      <SignupForm plan={plan} />
    </AuthShell>
  );
}
