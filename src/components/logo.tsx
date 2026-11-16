import Link from "next/link";

export function LogoMark({ size = 30 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo.png" alt="" width={size} height={size} className="shrink-0" />;
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} aria-label="FraudFenceAI home" className="flex items-center gap-2 font-display text-[19px] font-semibold tracking-tight text-ink">
      <LogoMark />
      <span>FraudFence<span className="text-ink-mute">AI</span></span>
    </Link>
  );
}
