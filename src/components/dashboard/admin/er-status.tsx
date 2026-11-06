"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Ambulance, ArrowRight, Hourglass, Siren } from "lucide-react";
import { erNow, erTriage } from "@/data/operations";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const levelTone = [
  "bg-red-600 text-white",
  "bg-coral-700 text-white",
  "bg-amber-400 text-amber-950",
  "bg-blue-600 text-white",
  "bg-muted text-foreground",
];

/** Emergency department status that drifts a little every few seconds, like a live feed. */
export function ErStatusCard({ className }: { className?: string }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 6000);
    return () => clearInterval(t);
  }, []);

  const wobble = (amp: number, phase: number) => Math.round(Math.sin(tick * 0.9 + phase) * amp);
  const waiting = erNow.waiting + wobble(2, 1);
  const avgWait = erNow.avgWait + wobble(2, 2);
  const occupied = Math.min(erNow.beds, erNow.bedsOccupied + wobble(1, 3));
  const counts = erTriage.map((t, i) => Math.max(0, t.count + (i === 2 ? wobble(1, 4) : i === 3 ? wobble(1, 5) : 0)));

  return (
    <section className={cn("rounded-2xl border border-border bg-surface shadow-soft", className)} aria-labelledby="er-status-title">
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 id="er-status-title" className="flex items-center gap-2 text-base font-bold">
            <Siren className="size-4 text-red-600 dark:text-red-400" aria-hidden />
            Emergency right now
          </h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="relative flex size-2" aria-hidden>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-green-600" />
            </span>
            Live feed, updates every few seconds
          </p>
        </div>
      </div>
      <div className="space-y-5 p-5">
        <dl className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-surface-2 p-3">
            <dt className="text-xs text-muted-foreground">Waiting</dt>
            <dd className="font-display text-2xl font-extrabold tabular-nums">{waiting}</dd>
          </div>
          <div className="rounded-xl bg-surface-2 p-3">
            <dt className="text-xs text-muted-foreground">Avg wait</dt>
            <dd className="font-display text-2xl font-extrabold tabular-nums">
              {avgWait}
              <span className="text-sm font-semibold text-muted-foreground"> min</span>
            </dd>
          </div>
          <div className="rounded-xl bg-surface-2 p-3">
            <dt className="text-xs text-muted-foreground">Treating</dt>
            <dd className="font-display text-2xl font-extrabold tabular-nums">{erNow.inTreatment}</dd>
          </div>
        </dl>

        <div>
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="font-semibold">ER beds</span>
            <span className="text-muted-foreground tabular-nums">
              {occupied} of {erNow.beds} in use
            </span>
          </div>
          <Progress value={occupied} max={erNow.beds} tone={occupied / erNow.beds >= 0.9 ? "coral" : "brand"} label="ER beds in use" />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold">Waiting by triage level</p>
          <ul className="space-y-1.5">
            {erTriage.map((t, i) => (
              <li key={t.level} className="flex items-center gap-2 text-sm">
                <span className={cn("grid size-6 shrink-0 place-items-center rounded-md text-xs font-bold", levelTone[i])}>{t.level}</span>
                <span className="flex-1 truncate">{t.label}</span>
                <span className="text-xs text-muted-foreground">target {t.target}</span>
                <span className="w-6 text-right font-bold tabular-nums">{counts[i]}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Ambulance className="size-3.5" aria-hidden /> {erNow.ambulancesInbound} ambulances inbound
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Hourglass className="size-3.5" aria-hidden /> Longest wait {erNow.longestWait + wobble(3, 6)} min
          </span>
          <Link href="/dashboard/analytics#er-heatmap" className="ml-auto inline-flex items-center gap-1 font-semibold text-primary hover:underline">
            Wait patterns <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
