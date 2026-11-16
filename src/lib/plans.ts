export type PlanId = "trial" | "starter" | "growth" | "scale";

export interface Plan {
  id: PlanId;
  name: string;
  price: number | null;
  screenings: number; // per calendar month
  aiInvestigations: number; // per calendar month
  rules: number;
  apiAccess: boolean;
  blurb: string;
  features: string[];
  checkoutUrl?: string;
}

// NEXT_PUBLIC_* values are inlined at build time, so each must be referenced statically.
export const PLANS: Record<PlanId, Plan> = {
  trial: {
    id: "trial",
    name: "Trial",
    price: null,
    screenings: 100,
    aiInvestigations: 5,
    rules: 3,
    apiAccess: false,
    blurb: "14 days to evaluate the platform.",
    features: [],
  },
  starter: {
    id: "starter",
    name: "Starter",
    price: 47,
    screenings: 1000,
    aiInvestigations: 25,
    rules: 10,
    apiAccess: false,
    blurb: "For early-stage teams screening their first live payments.",
    features: [
      "1,000 transaction screenings / month",
      "25 AI case investigations / month",
      "10 custom rules",
      "Customer risk rating",
      "Watchlist and sanctions screening",
      "Case management",
    ],
    checkoutUrl: process.env.NEXT_PUBLIC_SELAR_STARTER_URL || "https://selar.com/47plan?currency=USD",
  },
  growth: {
    id: "growth",
    name: "Growth",
    price: 57,
    screenings: 5000,
    aiInvestigations: 100,
    rules: 30,
    apiAccess: true,
    blurb: "For growing merchants and fintechs that need real-time decisions.",
    features: [
      "5,000 transaction screenings / month",
      "100 AI case investigations / month",
      "30 custom rules",
      "REST API for real-time screening",
      "Connections graph",
      "Everything in Starter",
    ],
    checkoutUrl: process.env.NEXT_PUBLIC_SELAR_GROWTH_URL || "https://selar.com/57plan?currency=USD",
  },
  scale: {
    id: "scale",
    name: "Scale",
    price: 97,
    screenings: 25000,
    aiInvestigations: 500,
    rules: 100,
    apiAccess: true,
    blurb: "For high-volume teams running risk operations every day.",
    features: [
      "25,000 transaction screenings / month",
      "500 AI case investigations / month",
      "100 custom rules",
      "REST API for real-time screening",
      "Connections graph",
      "Everything in Growth",
    ],
    checkoutUrl: process.env.NEXT_PUBLIC_SELAR_SCALE_URL || "https://selar.com/97plan?currency=USD",
  },
};

export const PAID_PLANS: PlanId[] = ["starter", "growth", "scale"];

export function planFromAmount(amount: number): PlanId | null {
  return PAID_PLANS.find((p) => PLANS[p].price === Math.round(amount)) ?? null;
}

export interface OrgBilling {
  plan: PlanId;
  plan_status: "trialing" | "active" | "past_due" | "canceled";
  trial_ends_at: string;
  current_period_end: string | null;
}

/** The plan whose limits currently apply. Expired trials and inactive subscriptions get no access. */
export function effectivePlan(org: OrgBilling, now = new Date()): { plan: Plan; active: boolean; reason?: string } {
  const plan = PLANS[org.plan];
  if (org.plan === "trial") {
    const ok = new Date(org.trial_ends_at) > now;
    return { plan, active: ok, reason: ok ? undefined : "Your trial has ended. Choose a plan to continue." };
  }
  if (org.plan_status === "active") {
    if (org.current_period_end && new Date(org.current_period_end) < now) {
      return { plan, active: false, reason: "Your subscription period has ended. Renew to continue." };
    }
    return { plan, active: true };
  }
  return { plan, active: false, reason: "Your subscription is not active." };
}

export function monthStart(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}
