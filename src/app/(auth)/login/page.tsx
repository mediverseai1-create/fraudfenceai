import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; setup?: string; error?: string }> }) {
  const sp = await searchParams;
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your FraudFenceAI workspace."
      footer={<>New to FraudFenceAI? <Link href="/signup" className="font-medium text-ink underline">Sign up</Link></>}
    >
      {sp.setup && (
        <p className="mb-4 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-warn">Sign-in is temporarily unavailable. Please try again shortly.</p>
      )}
      {sp.error && <p className="mb-4 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-danger">
        {sp.error === "link-expired" ? "That link has expired. Request a new one." : "Your account has no organization. Contact support."}
      </p>}
      <LoginForm next={sp.next} />
      <p className="mt-4 text-center text-sm"><Link href="/forgot-password" className="text-ink-soft underline">Forgot password?</Link></p>
    </AuthShell>
  );
}
