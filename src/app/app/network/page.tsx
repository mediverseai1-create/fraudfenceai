import type { Metadata } from "next";
import Link from "next/link";
import { requireOrg } from "@/lib/session";
import { buildClusters, type Cluster } from "@/lib/risk/graph";
import { Empty, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Connections" };

const COLOR = { device: "#0d1020", email: "#0f9d78", ip: "#d98a0b" } as const;

function ClusterGraph({ cluster }: { cluster: Cluster }) {
  const size = 280, cx = size / 2, cy = size / 2;
  const nodes = cluster.customers.slice(0, 12);
  const pos = new Map(nodes.map((c, i) => {
    const a = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
    return [c, { x: cx + Math.cos(a) * 105, y: cy + Math.sin(a) * 105 }];
  }));
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full max-w-[280px]" role="img" aria-label={`Graph of ${cluster.customers.length} linked customers`}>
      {cluster.links.flatMap((l, li) => {
        const pts = l.customers.map((c) => pos.get(c)).filter(Boolean) as { x: number; y: number }[];
        return pts.flatMap((p, i) => pts.slice(i + 1).map((q, j) => <line key={`${li}-${i}-${j}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={COLOR[l.kind]} strokeOpacity="0.55" strokeWidth="1.5" />));
      })}
      {nodes.map((c) => {
        const p = pos.get(c)!;
        return (
          <g key={c}>
            <circle cx={p.x} cy={p.y} r="9" fill="#fff" stroke="#0d1020" strokeWidth="1.5" />
            <text x={p.x} y={p.y + 22} textAnchor="middle" fontSize="8" fill="#3b4056">{c.length > 12 ? `${c.slice(0, 11)}…` : c}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default async function Network() {
  const { supabase, org, billing } = await requireOrg();
  if (!billing.plan.apiAccess && org.plan !== "trial") {
    return (
      <>
        <PageHeader title="Connections" />
        <div className="card"><Empty title="Included in Growth and Scale" body="Upgrade to see clusters of customers who share devices, emails or IP addresses." href="/app/billing" cta="View plans" /></div>
      </>
    );
  }
  const { data } = await supabase.from("transactions").select("customer_ref, device_id, email, ip").eq("org_id", org.id).not("customer_ref", "is", null).order("created_at", { ascending: false }).limit(5000);
  const clusters = buildClusters(data ?? []);

  return (
    <>
      <PageHeader title="Connections" subtitle="Customers linked by a shared device, email address or IP address, from your last 5,000 transactions." />
      <div className="mb-4 flex gap-4 text-xs text-ink-soft">{(["device", "email", "ip"] as const).map((k) => <span key={k} className="flex items-center gap-1.5"><span className="h-0.5 w-5" style={{ background: COLOR[k] }} />Shared {k}</span>)}</div>
      {clusters.length ? (
        <div className="grid gap-5 md:grid-cols-2">
          {clusters.slice(0, 20).map((c) => (
            <section key={c.id} className="card flex flex-col items-center gap-4 p-5 sm:flex-row sm:items-start">
              <ClusterGraph cluster={c} />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium">{c.customers.length} linked customers</p>
                <ul className="mt-2 space-y-1.5 text-xs text-ink-soft">
                  {c.links.slice(0, 6).map((l, i) => <li key={i} className="break-all"><span className="font-medium capitalize text-ink">{l.kind}</span> {l.value} <span className="text-ink-mute">({l.customers.length} customers)</span></li>)}
                </ul>
                <Link href="/app/customers" className="mt-3 inline-block text-xs underline">Review customers</Link>
              </div>
            </section>
          ))}
        </div>
      ) : <div className="card"><Empty title="No linked customers found" body="Clusters appear when two or more customer references share a device ID, email or IP across screened transactions." /></div>}
    </>
  );
}
