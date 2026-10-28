"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, BedDouble, DoorOpen, FileHeart, Pill, Siren, Biohazard } from "lucide-react";
import { clinicalDetail, HOME_WARD, wards } from "@/data/clinical";
import { doctorsById } from "@/data/doctors";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label, NativeSelect } from "@/components/ui/form-controls";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { AllergyBadges, FilterChip, NewsBadge, PatientIdentity, SafetyFlags, useLatestVitals } from "../shared";
import { BandLegend, BedTile, useWardBeds, type Bed } from "./ward-beds";
import { useDoses } from "./use-doses";

type Filter = "all" | "attention" | "discharge";

/** Ward board: every bed as a tile, colored by early warning score. */
export function WardScreen() {
  const [ward, setWard] = useState(HOME_WARD);
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<Bed | null>(null);
  const beds = useWardBeds(ward);

  const occupied = beds.filter((b) => b.patient);
  const attention = (b: Bed) => !!b.patient && (b.news >= 3 || b.patient.status === "critical");
  const discharge = (b: Bed) => !!b.patient && !!clinicalDetail(b.patient).dischargeToday;
  const shown = filter === "all" ? beds : beds.filter(filter === "attention" ? attention : discharge);

  return (
    <div>
      <PageHeader
        eyebrow="Sam Okafor · Charge nurse"
        title="Ward board"
        description="Tap a bed for details and quick actions. Tiles are colored by NEWS and always show the score."
        actions={
          <div className="flex items-center gap-2">
            <Label htmlFor="ward-select" className="sr-only">
              Ward
            </Label>
            <NativeSelect id="ward-select" value={ward} onChange={(e) => setWard(e.target.value)} className="h-10 w-56">
              {wards.map((w) => (
                <option key={w}>{w}</option>
              ))}
            </NativeSelect>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Beds occupied" value={`${occupied.length}/${beds.length}`} icon={BedDouble} hint={`${beds.length - occupied.length} free`} />
        <StatCard label="Need attention" value={beds.filter(attention).length} icon={Siren} tone="red" hint="NEWS 3+ or critical" />
        <StatCard label="Discharge today" value={beds.filter(discharge).length} icon={DoorOpen} tone="blue" />
        <StatCard
          label="In isolation"
          value={occupied.filter((b) => clinicalDetail(b.patient!).flags.isolation).length}
          icon={Biohazard}
          tone="violet"
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter beds">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")} count={beds.length}>
            All beds
          </FilterChip>
          <FilterChip active={filter === "attention"} onClick={() => setFilter("attention")} count={beds.filter(attention).length}>
            Needs attention
          </FilterChip>
          <FilterChip active={filter === "discharge"} onClick={() => setFilter("discharge")} count={beds.filter(discharge).length}>
            Discharge today
          </FilterChip>
        </div>
        <BandLegend />
      </div>

      <ul className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {shown.map((b) => (
          <li key={b.bed}>
            <BedTile bed={b} onOpen={() => setOpen(b)} />
          </li>
        ))}
      </ul>
      {shown.length === 0 && <p className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted-foreground">No beds match this filter.</p>}

      <BedSheet bed={open} ward={ward} onClose={() => setOpen(null)} />
    </div>
  );
}

/** Side sheet with a patient's key details and quick actions. */
export function BedSheet({ bed, ward, onClose }: { bed: Bed | null; ward: string; onClose: () => void }) {
  const latest = useLatestVitals();
  const doses = useDoses(ward);
  const p = bed?.patient;
  const d = p ? clinicalDetail(p) : undefined;
  const lv = p ? latest[p.id] : undefined;
  const next = p ? doses.filter((x) => x.patient.id === p.id && x.status === "due").slice(0, 3) : [];
  const doctor = p ? doctorsById[p.doctorId]?.name : undefined;

  return (
    <Sheet open={!!p} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="max-w-md overflow-y-auto">
        {p && d && bed && (
          <div className="p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              {ward} · Bed {bed.bed}
            </p>
            <SheetTitle className="sr-only">{p.name}</SheetTitle>
            <SheetDescription className="sr-only">Bed details and quick actions</SheetDescription>
            <div className="mt-3 pr-10">
              <PatientIdentity patient={p} size={52} sub={`${p.age} ${p.sex === "F" ? "female" : "male"} · ${p.mrn}`} />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <NewsBadge score={bed.news} showLabel />
              <StatusBadge status={p.status} />
              {d.dischargeToday && <StatusBadge status="submitted" label="Discharge today" />}
            </div>
            <p className="mt-4 text-sm font-semibold">{p.condition}</p>
            <p className="text-xs text-muted-foreground">
              {doctor ? `${doctor} · ` : ""}Admitted {p.admittedAt}
            </p>

            <div className="mt-4 space-y-2">
              <AllergyBadges allergies={p.allergies} />
              <SafetyFlags patient={p} detail={d} />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              {[
                ["HR", lv?.hr ?? p.vitals.hr, "bpm"],
                ["BP", lv ? `${lv.sys}/${lv.dia}` : p.vitals.bp, ""],
                ["SpO2", `${lv?.spo2 ?? p.vitals.spo2}%`, ""],
                ["Temp", lv?.temp ?? p.vitals.temp, "°C"],
                ["RR", lv?.rr ?? p.vitals.rr, "/min"],
                ["Pain", `${lv?.pain ?? d.pain}/10`, ""],
              ].map(([l, v, u]) => (
                <div key={l} className="rounded-xl bg-surface-2 p-2">
                  <p className="text-[11px] font-semibold text-muted-foreground">{l}</p>
                  <p className="font-display font-extrabold tabular-nums">
                    {v} <span className="text-[10px] font-normal text-muted-foreground">{u}</span>
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">{lv ? `Recorded by ${lv.by}` : "Last set on the chart"}</p>

            {d.sbar && (
              <div className="mt-5 rounded-2xl border border-border p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Situation</p>
                <p className="mt-1 text-sm">{d.sbar.situation}</p>
                <p className="mt-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Plan</p>
                <p className="mt-1 text-sm">{d.sbar.recommendation}</p>
              </div>
            )}

            <div className="mt-5">
              <p className="text-sm font-bold">Next medicines</p>
              {next.length ? (
                <ul className="mt-2 space-y-1.5 text-sm">
                  {next.map((x) => (
                    <li key={x.key} className={cn("flex justify-between gap-2 rounded-lg px-2 py-1", x.overdue && "bg-red-50 dark:bg-red-950/40")}>
                      <span>
                        {x.med.name} {x.med.dose} {x.med.route}
                      </span>
                      <span className={cn("tabular-nums text-muted-foreground", x.overdue && "font-bold text-red-700 dark:text-red-300")}>
                        {x.round}
                        {x.overdue && " · late"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">Nothing due today.</p>
              )}
            </div>

            <div className="mt-6 grid gap-2">
              <Button asChild>
                <Link href={`/dashboard/vitals?patient=${p.id}`}>
                  <Activity aria-hidden /> Record vitals
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/dashboard/patients/${p.id}`}>
                  <FileHeart aria-hidden /> Open chart
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/dashboard/rounds">
                  <Pill aria-hidden /> Medication rounds
                </Link>
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
