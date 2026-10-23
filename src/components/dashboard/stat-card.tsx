import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const tones = {
  brand: "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200",
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200",
  coral: "bg-coral-50 text-coral-700 dark:bg-orange-950 dark:text-orange-200",
  green: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-200",
  red: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200",
  violet: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-200",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-200",
} as const;

export type Tone = keyof typeof tones;

/**
 * KPI tile. `delta` is a signed percent; `goodWhen` says whether up or down is good
 * (e.g. wait time going down is good) so the color is right.
 */
export function StatCard({
  label,
  value,
  icon: IconCmp,
  tone = "brand",
  delta,
  goodWhen = "up",
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  tone?: Tone;
  delta?: number;
  goodWhen?: "up" | "down";
  hint?: React.ReactNode;
  className?: string;
}) {
  const up = (delta ?? 0) >= 0;
  const good = delta === undefined ? true : up === (goodWhen === "up");
  return (
    <div className={cn("rounded-2xl border border-border bg-surface p-5 shadow-soft", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {IconCmp && (
          <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", tones[tone])}>
            <IconCmp className="size-5" aria-hidden />
          </span>
        )}
      </div>
      <p className="mt-1 font-display text-3xl font-extrabold tabular-nums">{value}</p>
      {(delta !== undefined || hint) && (
        <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          {delta !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-bold",
                good ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
              )}
            >
              {up ? <TrendingUp className="size-3" aria-hidden /> : <TrendingDown className="size-3" aria-hidden />}
              {Math.abs(delta)}%
            </span>
          )}
          {hint}
        </p>
      )}
    </div>
  );
}

export const toneClasses = tones;
