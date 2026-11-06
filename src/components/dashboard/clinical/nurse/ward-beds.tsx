"use client";

import { useMemo } from "react";
import { DoorOpen } from "lucide-react";
import { clinicalDetail, newsBandLabels, wardBedCount, wardPatients } from "@/data/clinical";
import type { Patient } from "@/data/patients";
import { cn, initials } from "@/lib/utils";
import { bandStyles, displayBand, NewsBadge, SafetyFlags, useNewsOf } from "../shared";

export interface Bed {
  bed: string;
  patient?: Patient;
  news: number;
}

/** Beds of a ward with their occupant and current NEWS. */
export function useWardBeds(ward: string): Bed[] {
  const newsOf = useNewsOf();
  return useMemo(() => {
    const occupants = wardPatients(ward);
    return Array.from({ length: wardBedCount(ward) }, (_, i) => {
      const bed = String(i + 1).padStart(2, "0");
      const patient = occupants.find((p) => p.bed === bed);
      return { bed, patient, news: patient ? newsOf(patient) : 0 };
    });
  }, [ward, newsOf]);
}

/** Full bed tile for the ward board. */
export function BedTile({ bed, onOpen }: { bed: Bed; onOpen: () => void }) {
  const p = bed.patient;
  if (!p) {
    return (
      <div className="flex min-h-36 flex-col justify-between rounded-2xl border-2 border-dashed border-border bg-muted/40 p-4 text-muted-foreground">
        <span className="font-display text-lg font-extrabold">Bed {bed.bed}</span>
        <span className="flex items-center gap-1.5 text-sm">
          <DoorOpen className="size-4" aria-hidden /> Empty, ready for admission
        </span>
      </div>
    );
  }
  const band = displayBand(bed.news);
  const d = clinicalDetail(p);
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group flex min-h-36 flex-col rounded-2xl border-2 p-4 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
        bandStyles[band].tile,
        band === "high" && "ring-2 ring-red-500/40",
      )}
      aria-label={`Bed ${bed.bed}, ${p.name}, NEWS ${bed.news}, ${newsBandLabels[band]}. Open details.`}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <span className="font-display text-lg font-extrabold">Bed {bed.bed}</span>
        <NewsBadge score={bed.news} />
      </div>
      <p className="mt-2 truncate font-semibold">{p.name}</p>
      <p className="text-xs text-muted-foreground">
        {p.age} {p.sex} · {p.mrn}
      </p>
      <p className="mt-1 line-clamp-2 text-sm">{p.condition}</p>
      <div className="mt-auto flex flex-wrap gap-1 pt-3">
        {d.dischargeToday && (
          <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-200">Discharge today</span>
        )}
        <SafetyFlags patient={p} detail={d} compact />
      </div>
    </button>
  );
}

/** Small ward map: one square per bed, colored by NEWS band, with the score as text. */
export function WardMiniMap({ beds, onOpen }: { beds: Bed[]; onOpen?: (b: Bed) => void }) {
  return (
    <ul className="grid grid-cols-4 gap-2 sm:grid-cols-8">
      {beds.map((b) => {
        const band = displayBand(b.news);
        return (
          <li key={b.bed}>
            {b.patient ? (
              <button
                type="button"
                onClick={() => onOpen?.(b)}
                title={`${b.patient.name} · NEWS ${b.news}`}
                aria-label={`Bed ${b.bed}, ${b.patient.name}, NEWS ${b.news}, ${newsBandLabels[band]}`}
                className={cn("flex aspect-square w-full flex-col items-center justify-center rounded-xl border-2 text-center transition-transform hover:scale-105", bandStyles[band].tile)}
              >
                <span className="text-[10px] font-semibold text-muted-foreground">{b.bed}</span>
                <span className="font-display text-sm font-extrabold">{initials(b.patient.name)}</span>
                <span className={cn("text-[10px] font-bold tabular-nums", bandStyles[band].text)}>N{b.news}</span>
              </button>
            ) : (
              <span
                className="flex aspect-square w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/50 text-center text-muted-foreground"
                aria-label={`Bed ${b.bed}, empty`}
              >
                <span className="text-[10px] font-semibold">{b.bed}</span>
                <span className="text-[10px]">Empty</span>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function BandLegend({ className }: { className?: string }) {
  const items = [
    { band: "high" as const, text: "NEWS 7+ high" },
    { band: "medium" as const, text: "5–6 medium" },
    { band: "low-medium" as const, text: "3–4 watch" },
    { band: "low" as const, text: "0–2 low" },
  ];
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground", className)}>
      {items.map((i) => (
        <li key={i.band} className="flex items-center gap-1.5">
          <span className={cn("size-2.5 rounded-full", bandStyles[i.band].dot)} aria-hidden />
          {i.text}
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-full border border-dashed border-muted-foreground" aria-hidden />
        Empty bed
      </li>
    </ul>
  );
}
