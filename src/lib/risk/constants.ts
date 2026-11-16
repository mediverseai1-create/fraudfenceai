// FATF "call for action" jurisdictions change over time. This list is a configurable default,
// not legal advice. Review it against current FATF publications.
export const HIGH_RISK_COUNTRIES = new Set(["KP", "IR", "MM"]);
// Jurisdictions often placed under increased monitoring; moderate weight.
export const ELEVATED_RISK_COUNTRIES = new Set(["SY", "YE", "SS", "VE", "HT", "CD", "LY", "SO", "SD", "AF"]);

export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com", "temp-mail.org",
  "yopmail.com", "trashmail.com", "sharklasers.com", "getnada.com", "throwawaymail.com", "dispostable.com",
]);

export const CHANNELS = ["card", "ach", "wire", "p2p", "crypto"] as const;

export const RULE_FIELDS = [
  { id: "amount", label: "Amount", type: "number" },
  { id: "velocity_1h", label: "Transactions by customer in last hour", type: "number" },
  { id: "velocity_24h", label: "Transactions by customer in last 24h", type: "number" },
  { id: "sum_24h", label: "Customer spend in last 24h", type: "number" },
  { id: "ip_country", label: "IP country", type: "text" },
  { id: "billing_country", label: "Billing country", type: "text" },
  { id: "channel", label: "Channel", type: "text" },
  { id: "email_domain", label: "Email domain", type: "text" },
  { id: "merchant", label: "Merchant", type: "text" },
  { id: "hour_utc", label: "Hour of day (UTC)", type: "number" },
] as const;
export const RULE_FIELD_IDS = RULE_FIELDS.map((f) => f.id) as unknown as [string, ...string[]];
export const RULE_OPS = ["gt", "gte", "lt", "lte", "eq", "neq", "in", "contains"] as const;
export const RULE_OP_LABEL: Record<string, string> = {
  gt: ">", gte: "≥", lt: "<", lte: "≤", eq: "=", neq: "≠", in: "is one of", contains: "contains",
};
