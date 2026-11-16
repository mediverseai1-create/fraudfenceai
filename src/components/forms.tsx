"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

export interface ActionState { error?: string; message?: string; ok?: boolean }

export function Submit({ children, className = "btn-dark", pendingText = "Working…" }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingText : children}
    </button>
  );
}

export function Notice({ state }: { state: ActionState }) {
  if (state.error) return <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-danger">{state.error}</p>;
  if (state.message) return <p role="status" className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-mint-deep">{state.message}</p>;
  return null;
}

/** Wraps a server action with pending/error/success feedback. Resets the form after success when `reset` is set. */
export function ActionForm({
  action,
  children,
  className = "space-y-4",
  reset = false,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
  reset?: boolean;
}) {
  const [state, formAction] = useActionState(action, {} as ActionState);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (reset && (state.message || state.ok)) ref.current?.reset();
  }, [state, reset]);
  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      <Notice state={state} />
    </form>
  );
}

export function Field({ label, name, type = "text", placeholder, required, defaultValue, hint, step, min, max, maxLength }: {
  label: string; name: string; type?: string; placeholder?: string; required?: boolean; defaultValue?: string | number; hint?: string; step?: string; min?: number; max?: number; maxLength?: number;
}) {
  return (
    <div>
      <label htmlFor={name} className="label">{label}</label>
      <input id={name} name={name} type={type} placeholder={placeholder} required={required} defaultValue={defaultValue} step={step} min={min} max={max} maxLength={maxLength} className="input" />
      {hint && <p className="mt-1 text-xs text-ink-mute">{hint}</p>}
    </div>
  );
}
