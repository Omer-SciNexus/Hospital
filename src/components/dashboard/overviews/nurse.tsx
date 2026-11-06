"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, BedDouble, ClipboardList, ListChecks, Pill, Siren, Syringe } from "lucide-react";
import { HOME_WARD, shiftTasks } from "@/data/clinical";
import { useClinical } from "@/store/clinical";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Panel } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { ClinicalBanner, greeting, NewsBadge, PatientIdentity, displayBand, bandStyles } from "@/components/dashboard/clinical/shared";
import { BandLegend, WardMiniMap, useWardBeds, type Bed } from "@/components/dashboard/clinical/nurse/ward-beds";
import { BedSheet } from "@/components/dashboard/clinical/nurse/ward-screen";
import { useDoses, useNow, type Dose } from "@/components/dashboard/clinical/nurse/use-doses";
import { GiveDoseDialog } from "@/components/dashboard/clinical/nurse/dose-dialogs";

/** Nurse home: the ward at a glance, medicines due, early warnings and shift tasks. */
export function NurseOverview() {
  const beds = useWardBeds(HOME_WARD);
  const doses = useDoses(HOME_WARD);
  const now = useNow();
  const tasks = useClinical((s) => s.tasks);
  const toggleTask = useClinical((s) => s.toggleTask);
  const [giving, setGiving] = useState<Dose | null>(null);
  const [openBed, setOpenBed] = useState<Bed | null>(null);

  const occupied = beds.filter((b) => b.patient);
  const alerts = occupied.filter((b) => b.news >= 5);
  const watch = [...occupied].filter((b) => b.news >= 3).sort((a, b) => b.news - a.news);
  const hour = now.getTime() + 3_600_000;
  const dueSoon = doses.filter((d) => d.status === "due" && d.due.getTime() <= hour);
  const nextRound = doses.find((d) => d.status === "due")?.round;
  const dueList = useMemo(() => {
    const list = doses.filter((d) => d.status === "due" && (d.due.getTime() <= hour || d.round === nextRound));
    return list.slice(0, 8);
  }, [doses, hour, nextRound]);
  const openTasks = shiftTasks.filter((t) => !tasks[t.id]).length;
  const sortedTasks = [...shiftTasks].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="space-y-6">
      <ClinicalBanner eyebrow={`Charge nurse · ${HOME_WARD} · Day shift`} title={`${greeting()}, Sam.`}>
        <p className="mt-2 text-brand-100">
          {occupied.length} patients on the ward, {alerts.length} with NEWS 5 or more.
          {nextRound ? ` Next medicine round: ${nextRound}.` : " All rounds done for today."}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild variant="white" size="sm">
            <Link href="/dashboard/ward">
              <BedDouble aria-hidden /> Ward board
            </Link>
          </Button>
          <Button asChild size="sm" className="bg-white/15 text-white ring-1 ring-white/30 hover:bg-white/25">
            <Link href="/dashboard/vitals">
              <Activity aria-hidden /> Record vitals
            </Link>
          </Button>
        </div>
      </ClinicalBanner>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Patients on ward" value={`${occupied.length}/${beds.length}`} icon={BedDouble} hint={`${beds.length - occupied.length} beds free`} />
        <StatCard label="Doses due next hour" value={dueSoon.length} icon={Pill} tone={dueSoon.some((d) => d.overdue) ? "red" : "coral"} hint={`${dueSoon.filter((d) => d.overdue).length} overdue`} />
        <StatCard label="NEWS alerts" value={alerts.length} icon={Siren} tone="red" hint="Score 5 or more" />
        <StatCard label="Tasks open" value={openTasks} icon={ListChecks} tone="violet" hint={`${shiftTasks.length - openTasks} done this shift`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Panel
          className="xl:col-span-3"
          title={`${HOME_WARD} map`}
          description="Each square is a bed. Tap one for details."
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/ward">
                Board <ArrowRight aria-hidden />
              </Link>
            </Button>
          }
        >
          <WardMiniMap beds={beds} onOpen={setOpenBed} />
          <BandLegend className="mt-4" />
        </Panel>

        <Panel
          className="xl:col-span-2"
          title={
            <span className="flex items-center gap-2">
              <Siren className="size-4 text-red-600" aria-hidden /> Early warnings
            </span>
          }
          description="Patients with NEWS 3 or more"
          bodyClassName="p-3"
        >
          <ul className="space-y-2">
            {watch.map((b) => (
              <li key={b.bed} className={cn("flex items-center gap-3 rounded-xl border p-3", bandStyles[displayBand(b.news)].tile)}>
                <PatientIdentity patient={b.patient!} size={34} sub={`Bed ${b.bed} · ${b.patient!.condition}`} className="flex-1" />
                <NewsBadge score={b.news} />
                <Button asChild size="icon" variant="ghost" className="size-8">
                  <Link href={`/dashboard/vitals?patient=${b.patient!.id}`} aria-label={`Record vitals for ${b.patient!.name}`}>
                    <Activity aria-hidden />
                  </Link>
                </Button>
              </li>
            ))}
            {watch.length === 0 && <li className="p-2 text-sm text-muted-foreground">No early warnings right now.</li>}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Medicines due now"
          description={nextRound ? `Overdue and due within the hour, plus the ${nextRound} round` : "Nothing left to give today"}
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/rounds">
                All rounds <ArrowRight aria-hidden />
              </Link>
            </Button>
          }
          bodyClassName="p-0"
        >
          {dueList.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">All doses given. Nice work.</p>
          ) : (
            <ul className="divide-y divide-border">
              {dueList.map((d) => (
                <li key={d.key} className={cn("flex items-center gap-3 px-5 py-3", d.overdue && "bg-red-50/70 dark:bg-red-950/30")}>
                  <span className={cn("w-12 shrink-0 text-sm font-bold tabular-nums", d.overdue && "text-red-700 dark:text-red-300")}>{d.round}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {d.med.name} {d.med.dose} <span className="font-normal text-muted-foreground">{d.med.route}</span>
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      Bed {d.patient.bed} · {d.patient.name}
                      {d.patient.allergies.length > 0 && ` · Allergy: ${d.patient.allergies.join(", ")}`}
                    </span>
                  </span>
                  {d.overdue ? <StatusBadge status="overdue" /> : <StatusBadge status="due" />}
                  <Button size="sm" onClick={() => setGiving(d)}>
                    <Syringe aria-hidden /> Give
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title={
            <span className="flex items-center gap-2">
              <ClipboardList className="size-4 text-primary" aria-hidden /> Shift tasks
            </span>
          }
          description={`${shiftTasks.length - openTasks} of ${shiftTasks.length} done`}
          bodyClassName="p-2"
        >
          <ul>
            {sortedTasks.map((t) => {
              const done = !!tasks[t.id];
              return (
                <li key={t.id}>
                  <label htmlFor={`task-${t.id}`} className="flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/50">
                    <Checkbox id={`task-${t.id}`} checked={done} onCheckedChange={() => toggleTask(t.id)} className="mt-0.5" />
                    <span className={cn("min-w-0 flex-1 text-sm", done && "text-muted-foreground line-through")}>{t.label}</span>
                    {t.priority === "urgent" && !done && <Badge variant="red">Urgent</Badge>}
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{t.time}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <GiveDoseDialog dose={giving} onClose={() => setGiving(null)} />
      <BedSheet bed={openBed} ward={HOME_WARD} onClose={() => setOpenBed(null)} />
    </div>
  );
}
