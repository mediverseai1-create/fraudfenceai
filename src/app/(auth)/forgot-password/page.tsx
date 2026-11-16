import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { ForgotForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPage() {
  return (
    <AuthShell title="Reset your password" subtitle="We will email you a link to choose a new one." footer={<Link href="/login" className="font-medium text-ink underline">Back to log in</Link>}>
      <ForgotForm />
    </AuthShell>
  );
}
