"use client";

import { ActionForm, Field, Submit } from "@/components/forms";
import { forgotPassword, login, resetPassword, signup } from "@/app/(auth)/actions";

export function LoginForm({ next }: { next?: string }) {
  return (
    <ActionForm action={login}>
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Email" name="email" type="email" required />
      <Field label="Password" name="password" type="password" required />
      <Submit className="btn-dark w-full" pendingText="Signing in…">Log in</Submit>
    </ActionForm>
  );
}

export function SignupForm({ plan }: { plan?: string }) {
  return (
    <ActionForm action={signup}>
      <input type="hidden" name="plan" value={plan ?? ""} />
      <Field label="Company name" name="company" placeholder="Acme Payments" maxLength={120} />
      <Field label="Work email" name="email" type="email" required />
      <Field label="Password" name="password" type="password" required hint="At least 8 characters." />
      <Submit className="btn-dark w-full" pendingText="Creating account…">Create account</Submit>
    </ActionForm>
  );
}

export function ForgotForm() {
  return (
    <ActionForm action={forgotPassword}>
      <Field label="Email" name="email" type="email" required />
      <Submit className="btn-dark w-full" pendingText="Sending…">Send reset link</Submit>
    </ActionForm>
  );
}

export function ResetForm() {
  return (
    <ActionForm action={resetPassword}>
      <Field label="New password" name="password" type="password" required hint="At least 8 characters." />
      <Submit className="btn-dark w-full" pendingText="Saving…">Update password</Submit>
    </ActionForm>
  );
}
