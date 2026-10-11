import { cn } from "@/lib/utils";

/** Simple bar. `tone` picks the fill color. */
export function Progress({
  value,
  max = 100,
  tone = "brand",
  className,
  label,
}: {
  value: number;
  max?: number;
  tone?: "brand" | "blue" | "coral" | "green" | "red" | "amber";
  className?: string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const fill = { brand: "bg-brand-500", blue: "bg-blue-600", coral: "bg-coral-500", green: "bg-green-600", red: "bg-red-600", amber: "bg-amber-500" }[tone];
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div className={cn("h-full rounded-full transition-[width] duration-700", fill)} style={{ width: `${pct}%` }} />
    </div>
  );
}
