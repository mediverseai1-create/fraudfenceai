import { describe, expect, it } from "vitest";
import { rateCustomer, scoreTransaction, type RiskContext } from "./engine";
import { nameSimilarity, screenName } from "./similarity";
import { buildClusters } from "./graph";
import { effectivePlan, planFromAmount } from "../plans";

const base: RiskContext = {
  customer: { avgAmount: 50, txCount: 10, ageDays: 90, isPep: false, sanctionsHit: false },
  count1h: 0, count24h: 0, sum24h: 0, deviceOtherCustomers: 0, emailOtherCustomers: 0,
  blocklist: { email: false, device: false, ip: false },
};
const tx = { amount: 40, channel: "card", device_id: "d1", ip_country: "US", billing_country: "US", email: "a@b.com", occurred_at: "2026-01-05T14:00:00Z" };

describe("scoreTransaction", () => {
  it("approves a normal transaction", () => {
    const r = scoreTransaction(tx, base, []);
    expect(r.decision).toBe("approve");
    expect(r.score).toBeLessThan(40);
  });
  it("declines blocklisted device", () => {
    const r = scoreTransaction(tx, { ...base, blocklist: { ...base.blocklist, device: true } }, []);
    expect(r.decision).toBe("decline");
  });
  it("flags spike + geo mismatch", () => {
    const r = scoreTransaction({ ...tx, amount: 900, ip_country: "RU" }, base, []);
    expect(r.decision).not.toBe("approve");
    expect(r.reasons.map((x) => x.code)).toContain("amount_spike_10x");
  });
  it("applies custom decline rule regardless of score", () => {
    const r = scoreTransaction(tx, base, [{ name: "cap", field: "amount", op: "gt", value: "10", points: 5, action: "decline", enabled: true }]);
    expect(r.decision).toBe("decline");
  });
  it("ignores disabled rules and caps at 100", () => {
    const r = scoreTransaction(tx, base, [{ name: "x", field: "amount", op: "gt", value: "1", points: 99, action: "flag", enabled: false }]);
    expect(r.reasons.some((x) => x.source === "rule")).toBe(false);
    const hot = scoreTransaction({ ...tx, amount: 5000 }, { ...base, blocklist: { email: true, device: true, ip: true } }, []);
    expect(hot.score).toBe(100);
  });
  it("detects velocity", () => {
    const r = scoreTransaction(tx, { ...base, count1h: 5 }, []);
    expect(r.reasons.map((x) => x.code)).toContain("velocity_1h");
  });
});

describe("rateCustomer", () => {
  it("rates sanctions hit high", () => {
    expect(rateCustomer({ country: "US", isPep: false, sanctionsHit: true, txCount: 0, declineCount: 0, reviewCount: 0 }).level).toBe("high");
  });
  it("rates clean customer low", () => {
    expect(rateCustomer({ country: "US", isPep: false, sanctionsHit: false, txCount: 5, declineCount: 0, reviewCount: 0 }).level).toBe("low");
  });
});

describe("name screening", () => {
  it("matches reordered names", () => expect(nameSimilarity("John Smith", "Smith, John")).toBe(1));
  it("matches close spellings and rejects unrelated", () => {
    const list = [{ id: "1", list_name: "L", entry_type: "sanctions", value: "Mohammad Al-Rashid" }];
    expect(screenName("Muhammad Al Rashid", list, 0.8).length).toBe(1);
    expect(screenName("Jane Doe", list).length).toBe(0);
  });
});

describe("graph", () => {
  it("clusters customers sharing a device", () => {
    const c = buildClusters([
      { customer_ref: "a", device_id: "d", email: null, ip: null },
      { customer_ref: "b", device_id: "d", email: null, ip: null },
      { customer_ref: "c", device_id: "z", email: null, ip: null },
    ]);
    expect(c).toHaveLength(1);
    expect(c[0].customers.sort()).toEqual(["a", "b"]);
  });
});

describe("plans", () => {
  it("maps amounts to plans", () => {
    expect(planFromAmount(47)).toBe("starter");
    expect(planFromAmount(57)).toBe("growth");
    expect(planFromAmount(97)).toBe("scale");
    expect(planFromAmount(10)).toBeNull();
  });
  it("expires trials", () => {
    const o = { plan: "trial" as const, plan_status: "trialing" as const, trial_ends_at: "2020-01-01", current_period_end: null };
    expect(effectivePlan(o).active).toBe(false);
  });
});
