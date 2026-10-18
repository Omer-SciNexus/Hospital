import type { Insurer } from "@/data/insurers";
import { cn } from "@/lib/utils";

/** Made-up insurer "logo": colored initials mark plus name, all in HTML. */
export function InsurerLogo({ insurer, className, compact }: { insurer: Insurer; className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className="grid size-9 shrink-0 place-items-center rounded-xl font-display text-sm font-extrabold text-white shadow-soft"
        style={{ background: `linear-gradient(135deg, ${insurer.color}, ${insurer.color}cc)` }}
        aria-hidden
      >
        {insurer.initials}
      </span>
      {!compact && <span className="font-display font-bold tracking-tight">{insurer.name}</span>}
    </span>
  );
}
