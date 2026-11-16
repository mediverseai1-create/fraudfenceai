"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export interface FormState { error?: string; message?: string }

const email = z.string().trim().toLowerCase().email("Enter a valid email address");
const password = z.string().min(8, "Password must be at least 8 characters").max(72);

const safeNext = (n: FormDataEntryValue | null) => {
  const s = typeof n === "string" ? n : "";
  return s.startsWith("/app") ? s : "/app";
};

async function origin() {
  const h = await headers();
  return process.env.NEXT_PUBLIC_SITE_URL || `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  if (!supabaseConfigured()) return { error: "The app is not connected to Supabase yet." };
  const parsed = z.object({ email, password: z.string().min(1, "Enter your password") }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Incorrect email or password." };
  redirect(safeNext(form.get("next")));
}

export async function signup(_: FormState, form: FormData): Promise<FormState> {
  if (!supabaseConfigured()) return { error: "The app is not connected to Supabase yet." };
  const parsed = z
    .object({ email, password, company: z.string().trim().max(120).optional() })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { company: parsed.data.company ?? "" }, emailRedirectTo: `${await origin()}/auth/callback` },
  });
  if (error) return { error: error.message };
  if (!data.session) return { message: "Check your inbox to confirm your email, then log in." };
  redirect(["starter", "growth", "scale"].includes(String(form.get("plan"))) ? "/app/billing" : "/app");
}

export async function forgotPassword(_: FormState, form: FormData): Promise<FormState> {
  if (!supabaseConfigured()) return { error: "The app is not connected to Supabase yet." };
  const parsed = email.safeParse(form.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${await origin()}/auth/callback?next=/reset-password` });
  // Same response whether or not the account exists, to avoid account enumeration.
  return { message: "If an account exists for that email, a reset link is on its way." };
}

export async function resetPassword(_: FormState, form: FormData): Promise<FormState> {
  const parsed = password.safeParse(form.get("password"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { error: error.message };
  redirect("/app");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
