"use client";

import { useMemo, useState } from "react";
import { House, Video } from "lucide-react";
import { daysFromNow, formatDay } from "@/lib/dates";
import { cn } from "@/lib/utils";

const windows = {
  home: ["07:00–09:00", "09:00–11:00", "11:00–13:00", "16:00–18:00"],
  video: ["09:00", "10:30", "12:00", "14:30", "17:00", "19:00"],
};

/** Five days of time slots for home sample collection or a video visit. A few slots show as full. */
export function SlotPicker({
  kind,
  value,
  onChange,
  invalid,
}: {
  kind: "home" | "video";
  value?: string;
  onChange: (slot: string) => void;
  invalid?: boolean;
}) {
  const days = useMemo(() => Array.from({ length: 5 }).map((_, i) => formatDay(daysFromNow(i + 1))), []);
  const [day, setDay] = useState(() => days.find((d) => value?.startsWith(d)) ?? days[0]);
  const dayIndex = days.indexOf(day);
  const Icon = kind === "home" ? House : Video;

  return (
    <fieldset className={cn("rounded-2xl border bg-surface-2/50 p-4", invalid ? "border-red-500" : "border-border")}>
      <legend className="flex items-center gap-2 px-1 text-sm font-bold">
        <Icon className="size-4 text-brand-700 dark:text-brand-300" aria-hidden />
        {kind === "home" ? "Home sample collection slot" : "Video visit time"}
      </legend>
      <div role="group" aria-label="Day" className="scrollbar-none mt-2 flex gap-2 overflow-x-auto pb-1">
        {days.map((d) => {
          const [wd, ...rest] = d.split(" ");
          return (
            <button
              key={d}
              type="button"
              aria-pressed={d === day}
              onClick={() => setDay(d)}
              className={cn(
                "flex min-w-16 shrink-0 flex-col items-center rounded-xl border px-3 py-2 text-xs transition-colors",
                d === day ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:border-brand-400",
              )}
            >
              <span className="font-bold">{wd.replace(",", "")}</span>
              <span>{rest.join(" ")}</span>
            </button>
          );
        })}
      </div>
      <div role="radiogroup" aria-label="Time" className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {windows[kind].map((w, i) => {
          const full = (i + dayIndex * 2) % 5 === 3;
          const slot = `${day} · ${w}`;
          const selected = value === slot;
          return (
            <button
              key={w}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={full}
              onClick={() => onChange(slot)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-sm font-semibold tabular-nums transition-colors disabled:cursor-not-allowed disabled:line-through disabled:opacity-50",
                selected ? "border-primary bg-brand-50 text-brand-800 ring-2 ring-primary/30 dark:bg-brand-950 dark:text-brand-200" : "border-border bg-surface hover:border-brand-400",
              )}
            >
              {w}
              {full && <span className="sr-only"> (full)</span>}
            </button>
          );
        })}
      </div>
      {value && <p className="mt-3 text-xs text-muted-foreground">Selected: <span className="font-semibold text-foreground">{value}</span></p>}
    </fieldset>
  );
}
