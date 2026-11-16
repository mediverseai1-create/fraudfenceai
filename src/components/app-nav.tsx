"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, CreditCard, LayoutDashboard, ListChecks, Network, ScanSearch, Settings, ShieldAlert, Users } from "lucide-react";

const items = [
  { href: "/app", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/app/transactions", label: "Transactions", icon: ScanSearch },
  { href: "/app/cases", label: "Cases", icon: Briefcase },
  { href: "/app/customers", label: "Customers", icon: Users },
  { href: "/app/watchlists", label: "Watchlists", icon: ShieldAlert },
  { href: "/app/rules", label: "Rules", icon: ListChecks },
  { href: "/app/network", label: "Connections", icon: Network },
  { href: "/app/billing", label: "Billing", icon: CreditCard },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function AppNav() {
  const path = usePathname();
  return (
    <nav aria-label="Application" className="flex gap-1 overflow-x-auto lg:flex-col">
      {items.map((i) => {
        const active = i.exact ? path === i.href : path.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm ${active ? "bg-ink text-white" : "text-ink-soft hover:bg-mist"}`}
          >
            <i.icon size={17} />
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
