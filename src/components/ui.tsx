import Link from "next/link";

const decisionStyle: Record<string, string> = {
  approve: "bg-emerald-50 text-mint-deep",
  review: "bg-amber-50 text-warn",
  decline: "bg-red-50 text-danger",
};
export function DecisionBadge({ decision }: { decision: string }) {
  return <span className={`badge capitalize ${decisionStyle[decision] ?? "bg-mist text-ink-soft"}`}>{decision}</span>;
}

const levelStyle: Record<string, string> = { low: "bg-emerald-50 text-mint-deep", medium: "bg-amber-50 text-warn", high: "bg-red-50 text-danger" };
export function LevelBadge({ level }: { level: string }) {
  return <span className={`badge capitalize ${levelStyle[level] ?? "bg-mist text-ink-soft"}`}>{level}</span>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-medium">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Empty({ title, body, href, cta }: { title: string; body: string; href?: string; cta?: string }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="font-medium">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-ink-soft">{body}</p>
      {href && cta && <Link href={href} className="btn-dark btn-sm mt-4">{cta}</Link>}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-mute">{label}</p>
      <p className="mt-2 font-display text-3xl font-medium">{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-mute">{sub}</p>}
    </div>
  );
}

export function Meter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-ink-soft"><span>{label}</span><span>{used.toLocaleString()} / {limit.toLocaleString()}</span></div>
      <div className="h-1.5 overflow-hidden rounded-full bg-mist-deep" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className={`h-full rounded-full ${pct >= 90 ? "bg-danger" : "bg-ink"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export const money = (n: number | string, cur = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: /^[A-Z]{3}$/.test(cur) ? cur : "USD" }).format(Number(n));
export const when = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

export interface ReasonRow { label: string; points: number }
export function ReasonList({ reasons }: { reasons: ReasonRow[] }) {
  if (!reasons?.length) return <p className="text-xs text-ink-mute">No risk signals triggered.</p>;
  return (
    <ul className="space-y-1 text-xs">
      {reasons.map((r, i) => (
        <li key={i} className="flex justify-between gap-6"><span>{r.label}</span><span className="font-medium text-ink-soft">+{r.points}</span></li>
      ))}
    </ul>
  );
}
