const strip = (s: string) =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

function bigrams(s: string): Map<string, number> {
  const p = ` ${s} `;
  const m = new Map<string, number>();
  for (let i = 0; i < p.length - 1; i++) {
    const g = p.slice(i, i + 2);
    m.set(g, (m.get(g) ?? 0) + 1);
  }
  return m;
}

function dice(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const A = bigrams(a), B = bigrams(b);
  let inter = 0, total = 0;
  for (const [g, n] of A) { total += n; inter += Math.min(n, B.get(g) ?? 0); }
  for (const n of B.values()) total += n;
  return total === 0 ? 0 : (2 * inter) / total;
}

/** Name similarity in [0,1]. Order-insensitive: "John Smith" vs "Smith, John" scores 1. */
export function nameSimilarity(x: string, y: string): number {
  const a = strip(x), b = strip(y);
  if (!a || !b) return 0;
  const sortTokens = (s: string) => s.split(" ").sort().join(" ");
  return Math.max(dice(a, b), dice(sortTokens(a), sortTokens(b)));
}

export interface WatchEntry { id: string; list_name: string; entry_type: string; value: string; country?: string | null }
export interface NameMatch { entry: WatchEntry; score: number }

export function screenName(name: string, entries: WatchEntry[], threshold = 0.85): NameMatch[] {
  return entries
    .map((entry) => ({ entry, score: nameSimilarity(name, entry.value) }))
    .filter((m) => m.score >= threshold)
    .sort((a, b) => b.score - a.score);
}
