"use client";

import { useMemo, useState } from "react";
import { Hand, Syringe, Clock3 } from "lucide-react";
import { HOME_WARD, ROUND_TIMES } from "@/data/clinical";
import { formatTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { FilterChip } from "../shared";
import { GiveDoseDialog, HoldDoseDialog } from "./dose-dialogs";
import { useDoses, useNow, type Dose } from "./use-doses";

/** Medicine rounds for the ward, one table per round time. */
export function RoundsScreen() {
  const doses = useDoses(HOME_WARD);
  const now = useNow();
  const [giving, setGiving] = useState<Dose | null>(null);
  const [holding, setHolding] = useState<Dose | null>(null);
  const [onlyDue, setOnlyDue] = useState(false);

  const rounds = useMemo(() => ROUND_TIMES.map((time) => ({ time, doses: doses.filter((d) => d.round === time) })), [doses]);
  const due = doses.filter((d) => d.status === "due");
  const overdue = due.filter((d) => d.overdue);
  const current = rounds.find((r) => r.doses.some((d) => d.status === "due"))?.time;

  return (
    <div>
      <PageHeader
        eyebrow={`Sam Okafor · ${HOME_WARD}`}
        title="Medication rounds"
        description={
          <>
            {due.length} doses still to give today
            {overdue.length > 0 && <span className="font-semibold text-red-700 dark:text-red-300"> · {overdue.length} overdue</span>}. Every dose needs the five rights check.
          </>
        }
        actions={
          <div className="flex gap-2" role="group" aria-label="Filter doses">
            <FilterChip active={!onlyDue} onClick={() => setOnlyDue(false)} count={doses.length}>
              All doses
            </FilterChip>
            <FilterChip active={onlyDue} onClick={() => setOnlyDue(true)} count={due.length}>
              Still due
            </FilterChip>
          </div>
        }
      />

      <nav aria-label="Rounds" className="mb-6 grid grid-cols-5 gap-2">
        {rounds.map((r) => {
          const done = r.doses.filter((d) => d.status !== "due").length;
          const late = r.doses.some((d) => d.overdue);
          return (
            <a
              key={r.time}
              href={`#round-${r.time.replace(":", "")}`}
              className={cn(
                "rounded-2xl border bg-surface p-3 text-center shadow-soft transition-colors hover:border-brand-400",
                r.time === current ? "border-primary ring-2 ring-brand-500/30" : "border-border",
                late && "border-red-300 dark:border-red-800",
              )}
            >
              <span className="block font-display text-base font-extrabold tabular-nums sm:text-lg">{r.time}</span>
              <span className="block text-[11px] text-muted-foreground tabular-nums">
                {done}/{r.doses.length}
              </span>
              {late && <span className="mt-1 block text-[10px] font-bold uppercase text-red-700 dark:text-red-300">Late</span>}
            </a>
          );
        })}
      </nav>

      <div className="space-y-6">
        {rounds.map((r) => {
          const list = onlyDue ? r.doses.filter((d) => d.status === "due") : r.doses;
          const done = r.doses.filter((d) => d.status !== "due").length;
          const late = r.doses.filter((d) => d.overdue).length;
          const future = r.doses[0] && r.doses[0].due.getTime() > now.getTime() + 3_600_000;
          if (onlyDue && list.length === 0) return null;
          return (
            <section
              key={r.time}
              id={`round-${r.time.replace(":", "")}`}
              className={cn("scroll-mt-24 rounded-2xl border bg-surface shadow-soft", late ? "border-red-300 dark:border-red-800" : "border-border")}
              aria-labelledby={`round-title-${r.time}`}
            >
              <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
                <Clock3 className="size-5 text-primary" aria-hidden />
                <h2 id={`round-title-${r.time}`} className="text-base font-bold">
                  {r.time} round
                </h2>
                {r.time === current && <StatusBadge status="due" label="Current round" />}
                {late > 0 && <StatusBadge status="overdue" label={`${late} overdue`} />}
                {future && <span className="text-xs text-muted-foreground">Upcoming</span>}
                <div className="ml-auto flex w-full items-center gap-3 sm:w-64">
                  <Progress value={done} max={r.doses.length || 1} tone={late ? "red" : done === r.doses.length ? "green" : "brand"} label={`${r.time} round progress`} />
                  <span className="shrink-0 text-xs font-semibold tabular-nums">
                    {done}/{r.doses.length} done
                  </span>
                </div>
              </div>
              <div className="relative overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                      <th scope="col" className="px-5 py-2.5 font-bold">Bed</th>
                      <th scope="col" className="px-3 py-2.5 font-bold">Patient</th>
                      <th scope="col" className="px-3 py-2.5 font-bold">Drug</th>
                      <th scope="col" className="px-3 py-2.5 font-bold">Dose</th>
                      <th scope="col" className="px-3 py-2.5 font-bold">Route</th>
                      <th scope="col" className="px-3 py-2.5 font-bold">Status</th>
                      <th scope="col" className="px-5 py-2.5 text-right font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((d) => (
                      <tr key={d.key} className={cn("border-b border-border last:border-0", d.overdue && "bg-red-50/70 dark:bg-red-950/30")}>
                        <td className="px-5 py-3 font-display font-extrabold tabular-nums">{d.patient.bed}</td>
                        <td className="px-3 py-3">
                          <span className="font-semibold">{d.patient.name}</span>
                          {d.patient.allergies.length > 0 && (
                            <span className="block text-xs font-semibold text-red-700 dark:text-red-300">Allergy: {d.patient.allergies.join(", ")}</span>
                          )}
                        </td>
                        <td className="px-3 py-3 font-semibold">{d.med.name}</td>
                        <td className="px-3 py-3 tabular-nums">{d.med.dose}</td>
                        <td className="px-3 py-3">{d.med.route}</td>
                        <td className="px-3 py-3">
                          {d.overdue ? <StatusBadge status="overdue" label="Overdue" /> : <StatusBadge status={d.status} />}
                          {d.record && (
                            <span className="mt-0.5 block max-w-56 text-[11px] text-muted-foreground">
                              {d.record.status === "given" ? `${formatTime(d.record.at)} · ${d.record.by}` : `${d.record.reason ?? ""} · ${d.record.by}`}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {d.status === "due" ? (
                            <span className="flex justify-end gap-1.5">
                              <Button size="sm" variant="ghost" onClick={() => setHolding(d)} aria-label={`Hold ${d.med.name} for ${d.patient.name}`}>
                                <Hand aria-hidden /> Hold
                              </Button>
                              <Button size="sm" onClick={() => setGiving(d)} aria-label={`Give ${d.med.name} to ${d.patient.name}`}>
                                <Syringe aria-hidden /> Give
                              </Button>
                            </span>
                          ) : (
                            <span className="block text-right text-xs text-muted-foreground">Done</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>

      <GiveDoseDialog dose={giving} onClose={() => setGiving(null)} />
      <HoldDoseDialog dose={holding} onClose={() => setHolding(null)} />
    </div>
  );
}
