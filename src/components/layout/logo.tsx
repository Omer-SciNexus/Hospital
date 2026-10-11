import Link from "next/link";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={cn("size-9", className)}>
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0ea5a4" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="url(#logo-g)" />
      <path d="M17 10h6v7h7v6h-7v7h-6v-7h-7v-6h7z" fill="#fff" />
      <circle cx="31" cy="9" r="3.5" fill="#f97316" stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
}

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)} aria-label={`${site.name} home`}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className={cn("font-display text-lg font-extrabold tracking-tight", inverted ? "text-white" : "text-foreground")}>
          {site.shortName}
        </span>
        <span className={cn("text-[10px] font-semibold uppercase tracking-[0.2em]", inverted ? "text-brand-200" : "text-primary")}>
          Hospital
        </span>
      </span>
    </Link>
  );
}
