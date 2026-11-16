export interface GraphTx {
  customer_ref: string | null;
  device_id: string | null;
  email: string | null;
  ip: string | null;
}

export interface Cluster {
  id: number;
  customers: string[];
  links: { kind: "device" | "email" | "ip"; value: string; customers: string[] }[];
}

/** Groups customers into clusters that share at least one device, email or IP. */
export function buildClusters(txs: GraphTx[]): Cluster[] {
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    let r = x;
    while (parent.get(r) !== r) r = parent.get(r)!;
    parent.set(x, r);
    return r;
  };
  const union = (a: string, b: string) => {
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };

  const attr = new Map<string, Set<string>>();
  for (const t of txs) {
    const c = t.customer_ref;
    if (!c) continue;
    if (!parent.has(c)) parent.set(c, c);
    for (const [kind, v] of [["device", t.device_id], ["email", t.email?.toLowerCase()], ["ip", t.ip]] as const) {
      if (!v) continue;
      const k = `${kind}|${v}`;
      if (!attr.has(k)) attr.set(k, new Set());
      attr.get(k)!.add(c);
    }
  }
  const linked = [...attr.entries()].filter(([, s]) => s.size > 1);
  for (const [, s] of linked) {
    const [first, ...rest] = [...s];
    for (const o of rest) union(first, o);
  }
  const groups = new Map<string, Cluster>();
  let n = 0;
  for (const [k, s] of linked) {
    const root = find([...s][0]);
    if (!groups.has(root)) groups.set(root, { id: ++n, customers: [], links: [] });
    const g = groups.get(root)!;
    const [kind, ...v] = k.split("|");
    g.links.push({ kind: kind as "device" | "email" | "ip", value: v.join("|"), customers: [...s] });
    for (const c of s) if (!g.customers.includes(c)) g.customers.push(c);
  }
  return [...groups.values()].sort((a, b) => b.customers.length - a.customers.length);
}
