"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Biohazard, Footprints, HeartOff, ShieldAlert, TriangleAlert } from "lucide-react";
import type { Patient } from "@/data/patients";
import {
  clinicalDetail,
  flagLabels,
  flagLetters,
  newsBandLabels,
  type ClinicalDetail,
  type NewsBand,
  type ResultFlag,
} from "@/data/clinical";
import { useClinical, type VitalsEntry } from "@/store/clinical";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

/* ---------- NEWS ---------- */

export const bandStyles: Record<NewsBand, { pill: string; tile: string; dot: string; text: string }> = {
  high: {
    pill: "bg-red-600 text-white",
    tile: "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/60",
    dot: "bg-red-600",
    text: "text-red-700 dark:text-red-300",
  },
  medium: {
    pill: "bg-coral-600 text-white dark:bg-orange-600",
    tile: "border-orange-300 bg-coral-50 dark:border-orange-800 dark:bg-orange-950/50",
    dot: "bg-coral-500",
    text: "text-coral-700 dark:text-orange-300",
  },
  "low-medium": {
    pill: "bg-amber-100 text-amber-900 ring-1 ring-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-800",
    tile: "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40",
    dot: "bg-amber-500",
    text: "text-amber-800 dark:text-amber-300",
  },
  low: {
    pill: "bg-green-50 text-green-800 ring-1 ring-green-200 dark:bg-green-950 dark:text-green-200 dark:ring-green-900",
    tile: "border-border bg-surface",
    dot: "bg-green-600",
    text: "text-green-700 dark:text-green-300",
  },
};

/** Band used for display: like NEWS2, but 3–4 also shows as "watch closely". */
export function displayBand(score: number): NewsBand {
  if (score >= 7) return "high";
  if (score >= 5) return "medium";
  if (score >= 3) return "low-medium";
  return "low";
}

/** NEWS score pill. The number and the word "NEWS" are always shown, so color is never the only signal. */
export function NewsBadge({ score, band, showLabel, className }: { score: number; band?: NewsBand; showLabel?: boolean; className?: string }) {
  const b = band ?? displayBand(score);
  return (
    <span
      className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold tabular-nums", bandStyles[b].pill, className)}
      title={newsBandLabels[b]}
    >
      {(b === "high" || b === "medium") && <TriangleAlert className="size-3" aria-hidden />}
      NEWS {score}
      {showLabel ? <span className="font-semibold">· {newsBandLabels[b]}</span> : <span className="sr-only">, {newsBandLabels[b]}</span>}
    </span>
  );
}

/** Latest nurse-recorded vitals per patient (from the clinical store). */
export function useLatestVitals() {
  const vitals = useClinical((s) => s.vitals);
  return useMemo(() => {
    const map: Record<string, VitalsEntry> = {};
    for (const v of vitals) if (!map[v.patientId] || map[v.patientId].at < v.at) map[v.patientId] = v;
    return map;
  }, [vitals]);
}

/** Current NEWS for a patient: last recorded entry, else the seeded value. */
export function useNewsOf() {
  const latest = useLatestVitals();
  return useMemo(() => (p: Patient) => latest[p.id]?.news ?? p.news, [latest]);
}

/* ---------- Patient identity ---------- */

export function PatientIdentity({ patient, size = 36, sub, className }: { patient: Patient; size?: number; sub?: React.ReactNode; className?: string }) {
  return (
    <span className={cn("flex min-w-0 items-center gap-3", className)}>
      <Avatar name={patient.name} src={patient.avatar} size={size} />
      <span className="min-w-0">
        <span className="block truncate font-semibold text-foreground">{patient.name}</span>
        <span className="block truncate text-xs text-muted-foreground">{sub ?? `${patient.mrn} · ${patient.age}${patient.sex}`}</span>
      </span>
    </span>
  );
}

export function AllergyBadges({ allergies, className }: { allergies: string[]; className?: string }) {
  if (!allergies.length) return <Badge variant="muted" className={className}>No known allergies</Badge>;
  return (
    <span className={cn("flex flex-wrap gap-1", className)}>
      {allergies.map((a) => (
        <Badge key={a} variant="red" className="ring-1 ring-red-200 dark:ring-red-900">
          <TriangleAlert aria-hidden />
          <span className="sr-only">Allergy: </span>
          {a}
        </Badge>
      ))}
    </span>
  );
}

const flagShort = { fall: "Fall", allergy: "Allergy", iso: "Iso", dnr: "DNR" } as const;

/** Safety flags as small labelled chips (fall risk, allergy, isolation, DNR). */
export function SafetyFlags({ patient, detail, compact, className }: { patient: Patient; detail?: ClinicalDetail; compact?: boolean; className?: string }) {
  const d = detail ?? clinicalDetail(patient);
  const flags: { key: keyof typeof flagShort; label: string; icon: typeof Footprints; cls: string }[] = [];
  if (d.flags.fallRisk) flags.push({ key: "fall", label: "Fall risk", icon: Footprints, cls: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200" });
  if (patient.allergies.length) flags.push({ key: "allergy", label: `Allergy: ${patient.allergies.join(", ")}`, icon: TriangleAlert, cls: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200" });
  if (d.flags.isolation) flags.push({ key: "iso", label: `Isolation: ${d.flags.isolation}`, icon: Biohazard, cls: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-200" });
  if (d.flags.dnr) flags.push({ key: "dnr", label: "DNR order", icon: HeartOff, cls: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100" });
  if (!flags.length) return compact ? null : <span className={cn("text-xs text-muted-foreground", className)}>No safety flags</span>;
  return (
    <span className={cn("flex flex-wrap gap-1", className)}>
      {flags.map(({ key, label, icon: I, cls }) => (
        <span key={key} title={label} className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold", cls)}>
          <I className="size-3" aria-hidden />
          {compact ? (
            <>
              <span aria-hidden>{flagShort[key]}</span>
              <span className="sr-only">{label}</span>
            </>
          ) : (
            <span className="max-w-48 truncate">{label}</span>
          )}
        </span>
      ))}
    </span>
  );
}

/* ---------- Results ---------- */

const flagStyles: Record<ResultFlag, string> = {
  normal: "bg-muted text-muted-foreground",
  high: "bg-coral-50 text-coral-700 ring-1 ring-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:ring-orange-900",
  low: "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:ring-blue-900",
  abnormal: "bg-coral-50 text-coral-700 ring-1 ring-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:ring-orange-900",
  critical: "bg-red-600 text-white",
};

export function ResultFlagBadge({ flag, className }: { flag: ResultFlag; className?: string }) {
  return (
    <span
      className={cn("inline-flex min-w-7 items-center justify-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-extrabold", flagStyles[flag], className)}
      title={flagLabels[flag]}
    >
      {flag === "critical" && <ShieldAlert className="size-3" aria-hidden />}
      <span aria-hidden>{flagLetters[flag]}</span>
      <span className="sr-only">{flagLabels[flag]}</span>
    </span>
  );
}

/* ---------- Banner ---------- */

/** Gradient greeting banner used on the doctor and nurse overviews. */
export function ClinicalBanner({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-blue-700 p-6 text-white sm:p-8">
      <div className="relative z-10 max-w-xl md:max-w-[62%]">
        <p className="text-sm font-semibold text-brand-100">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{title}</h1>
        {children}
      </div>
      <Image src="/images/dashboard/welcome.png" alt="" width={260} height={260} className="absolute -bottom-6 right-4 hidden size-52 md:block" />
    </section>
  );
}

/* ---------- Misc ---------- */

export function dayKey(d: Date = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function greeting(d: Date = new Date()) {
  const h = d.getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

/** Small toggle chip with an optional count, used above lists. */
export function FilterChip({ active, onClick, children, count }: { active: boolean; onClick: () => void; children: React.ReactNode; count?: number }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-foreground hover:border-brand-400",
      )}
    >
      {children}
      {count !== undefined && (
        <span className={cn("rounded-full px-1.5 tabular-nums", active ? "bg-white/20" : "bg-muted text-muted-foreground")}>{count}</span>
      )}
    </button>
  );
}
