import Link from "next/link";
import { Check } from "lucide-react";
import { PAID_PLANS, PLANS, type PlanId } from "@/lib/plans";

/** If `current` is passed (billing page), the CTA opens the Selar checkout; otherwise it routes through sign-up. */
export function PricingGrid({ current, checkout = false }: { current?: PlanId; checkout?: boolean }) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {PAID_PLANS.map((id) => {
        const p = PLANS[id];
        const featured = id === "growth";
        const isCurrent = current === id;
        return (
          <div key={id} className={`card flex flex-col p-7 ${featured ? "border-ink ring-1 ring-ink" : ""}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-medium">{p.name}</h3>
              {featured && <span className="badge bg-ink text-white">Most popular</span>}
            </div>
            <p className="mt-3 flex items-baseline gap-1">
              <span className="font-display text-4xl font-medium">${p.price}</span>
              <span className="text-sm text-ink-mute">/ month</span>
            </p>
            <p className="mt-2 text-sm text-ink-soft">{p.blurb}</p>
            <ul className="mt-6 flex-1 space-y-2.5 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-mint-deep" />{f}</li>
              ))}
            </ul>
            {isCurrent ? (
              <span className="btn-light mt-7 cursor-default">Current plan</span>
            ) : checkout ? (
              <a href={p.checkoutUrl} target="_blank" rel="noopener noreferrer" className={`${featured ? "btn-dark" : "btn-light"} mt-7`}>
                Choose {p.name}
              </a>
            ) : (
              <Link href={`/signup?plan=${id}`} className={`${featured ? "btn-dark" : "btn-light"} mt-7`}>
                Start with {p.name}
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
