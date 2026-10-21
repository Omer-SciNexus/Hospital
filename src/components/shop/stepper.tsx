"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/** Compact − value + control. `label` names the value for screen readers ("Quantity", "Weeks"). */
export function Stepper({
  value,
  onChange,
  min = 1,
  max = 99,
  label,
  suffix,
  size = "md",
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
  suffix?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const btn = cn(
    "grid place-items-center rounded-full transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40",
    size === "sm" ? "size-7" : "size-9",
  );
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("inline-flex items-center rounded-full border border-border bg-surface p-0.5", className)}
    >
      <button type="button" className={btn} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`Decrease ${label.toLowerCase()}`}>
        <Minus className="size-3.5" aria-hidden />
      </button>
      <output aria-live="polite" className={cn("text-center font-semibold tabular-nums", size === "sm" ? "min-w-7 text-sm" : "min-w-10")}>
        {value}
        {suffix && <span className="ml-1 text-xs font-medium text-muted-foreground">{suffix}</span>}
      </output>
      <button type="button" className={btn} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`Increase ${label.toLowerCase()}`}>
        <Plus className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
