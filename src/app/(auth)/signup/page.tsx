import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { SignupForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Start free trial" };

export default function SignupPage() {
  return (
    <AuthShell
      title="Start your 14-day trial"
      subtitle="No card needed. 100 screenings and 5 AI investigations included."
      footer={<>Already have an account? <Link href="/login" className="font-medium text-ink underline">Log in</Link></>}
    >
      <SignupForm />
    </AuthShell>
  );
}
