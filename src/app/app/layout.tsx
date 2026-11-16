import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { Logo } from "@/components/logo";
import { logout } from "@/app/(auth)/actions";
import { isAdminEmail, requireOrg } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { org, user, billing } = await requireOrg();
  const daysLeft = Math.ceil((new Date(org.trial_ends_at).getTime() - Date.now()) / 86_400_000);
  return (
    <div className="min-h-screen bg-mist/40">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:gap-6">
        <aside className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:w-56 lg:shrink-0">
          <div className="card flex flex-col gap-4 p-3 lg:h-full">
            <div className="px-2 pt-1"><Logo href="/app" /></div>
            <AppNav />
            <div className="mt-auto hidden space-y-2 border-t border-line px-2 pt-3 text-xs text-ink-mute lg:block">
              <p className="truncate font-medium text-ink-soft">{org.name}</p>
              <p className="truncate">{user.email}</p>
              <p>Plan: <span className="font-medium capitalize text-ink">{org.plan}</span></p>
              {isAdminEmail(user.email) && <Link href="/admin" className="block underline">Admin</Link>}
              <form action={logout}><button className="underline">Log out</button></form>
            </div>
          </div>
        </aside>
        <main className="min-w-0 flex-1">
          {!billing.active ? (
            <div role="alert" className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-warn">
              {billing.reason} <Link href="/app/billing" className="font-medium underline">View plans</Link>
            </div>
          ) : org.plan === "trial" ? (
            <div className="mb-4 rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink-soft">
              Trial: {Math.max(daysLeft, 0)} day{daysLeft === 1 ? "" : "s"} left. <Link href="/app/billing" className="font-medium text-ink underline">Choose a plan</Link>
            </div>
          ) : null}
          {children}
          <form action={logout} className="mt-8 text-center lg:hidden"><button className="text-xs text-ink-mute underline">Log out</button></form>
        </main>
      </div>
    </div>
  );
}
