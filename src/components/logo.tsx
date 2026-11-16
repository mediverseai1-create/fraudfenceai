import Link from "next/link";

export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path d="M16 2 4 7v8c0 7.2 5 12.6 12 15 7-2.4 12-7.8 12-15V7L16 2Z" fill="#0d1020" />
      <path d="M10 16.5 14.5 21 22 11.5" stroke="#2dd4a7" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-display text-[19px] font-semibold tracking-tight text-ink">
      <LogoMark />
      FraudFence<span className="text-ink-mute">AI</span>
    </Link>
  );
}
