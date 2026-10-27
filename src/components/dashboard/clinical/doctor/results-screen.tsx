"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarPlus, CircleCheck, FileHeart, MessageCircle, ScanHeart } from "lucide-react";
import { clinicalPatientsById, doctorPatients, flagLabels, labResults, type LabResult } from "@/data/clinical";
import { useClinical } from "@/store/clinical";
import { chartColors, chartTheme } from "@/lib/chart";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { PageHeader, Panel } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { FilterChip, PatientIdentity, ResultFlagBadge } from "../shared";

type Filter = "review" | "abnormal" | "all";
const severity = { critical: 0, high: 1, low: 1, abnormal: 1, normal: 2 } as const;
const ago = (h: number) => (h < 1 ? "just now" : h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`);

/** Lab and imaging results inbox. Unreviewed and critical results come first. */
export function ResultsScreen() {
  const params = useSearchParams();
  const reviewed = useClinical((s) => s.reviewed);
  const [filter, setFilter] = useState<Filter>("review");
  const [selectedId, setSelectedId] = useState<string | null>(() => params.get("id"));
  const [sheetOpen, setSheetOpen] = useState(false);

  const isDone = (r: LabResult) => !!r.reviewed || !!reviewed[r.id];
  const mine = useMemo(() => {
    const ids = new Set(doctorPatients.map((p) => p.id));
    return labResults.filter((r) => ids.has(r.patientId));
  }, []);
  const sorted = useMemo(
    () =>
      [...mine].sort(
        (a, b) => Number(!!a.reviewed || !!reviewed[a.id]) - Number(!!b.reviewed || !!reviewed[b.id]) || severity[a.flag] - severity[b.flag] || a.hoursAgo - b.hoursAgo,
      ),
    [mine, reviewed],
  );
  const toReview = mine.filter((r) => !isDone(r));
  const shown = sorted.filter((r) => (filter === "review" ? !isDone(r) : filter === "abnormal" ? r.flag !== "normal" : true));
  const selected = mine.find((r) => r.id === selectedId) ?? shown[0];

  function select(id: string) {
    setSelectedId(id);
    if (!window.matchMedia("(min-width: 1024px)").matches) setSheetOpen(true);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Dr. Layla Haddad · Cardiology"
        title="Lab results"
        description={
          <>
            <span className="font-semibold text-foreground">{toReview.length} to review</span>
            {toReview.some((r) => r.flag === "critical") && (
              <span className="text-red-700 dark:text-red-300"> · {toReview.filter((r) => r.flag === "critical").length} critical</span>
            )}{" "}
            · Results from your patients&apos; labs, ECGs and scans.
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Panel
          title="Inbox"
          action={
            <div className="flex flex-wrap justify-end gap-1.5" role="group" aria-label="Filter results">
              <FilterChip active={filter === "review"} onClick={() => setFilter("review")} count={toReview.length}>
                To review
              </FilterChip>
              <FilterChip active={filter === "abnormal"} onClick={() => setFilter("abnormal")} count={mine.filter((r) => r.flag !== "normal").length}>
                Abnormal
              </FilterChip>
              <FilterChip active={filter === "all"} onClick={() => setFilter("all")} count={mine.length}>
                All
              </FilterChip>
            </div>
          }
          bodyClassName="p-2"
        >
          {shown.length === 0 ? (
            <EmptyState compact image="/images/dashboard/empty-records.png" title="Inbox clear" description="Every result has been reviewed." />
          ) : (
            <ul className="space-y-1" aria-label="Results">
              {shown.map((r) => {
                const p = clinicalPatientsById[r.patientId];
                const done = isDone(r);
                const active = selected?.id === r.id;
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => select(r.id)}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                        active ? "border-brand-400 bg-brand-50 dark:bg-brand-950" : "border-transparent hover:bg-muted/60",
                        r.flag === "critical" && !done && !active && "border-red-200 bg-red-50/60 dark:border-red-900 dark:bg-red-950/30",
                      )}
                    >
                      <ResultFlagBadge flag={r.flag} />
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate text-sm", done ? "font-medium" : "font-bold")}>
                          {!done && (
                            <>
                              <span className="mr-1.5 inline-block size-2 rounded-full bg-blue-600 align-middle" aria-hidden />
                              <span className="sr-only">Not reviewed: </span>
                            </>
                          )}
                          {r.name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {p?.name} · {ago(r.hoursAgo)}
                        </span>
                      </span>
                      {r.kind === "lab" ? (
                        <span className={cn("shrink-0 text-sm font-bold tabular-nums", r.flag === "critical" && "text-red-700 dark:text-red-300")}>
                          {r.value}
                          <span className="ml-0.5 text-xs font-normal text-muted-foreground">{r.unit}</span>
                        </span>
                      ) : (
                        <ScanHeart className="size-4 shrink-0 text-muted-foreground" aria-label="Imaging or ECG" />
                      )}
                      {done && <CircleCheck className="size-4 shrink-0 text-green-600" aria-label="Reviewed" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <div className="hidden lg:block">
          <div className="sticky top-24">{selected ? <ResultDetail result={selected} /> : null}</div>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="max-w-lg overflow-y-auto p-4 pt-14">
          <SheetTitle className="sr-only">Result detail</SheetTitle>
          <SheetDescription className="sr-only">Value, range, trend and actions</SheetDescription>
          {selected && <ResultDetail result={selected} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function RangeBar({ r }: { r: LabResult }) {
  if (r.value === undefined || r.low === undefined || r.high === undefined) return null;
  const span = r.high - r.low || 1;
  const min = Math.min(r.low - span * 0.5, r.value);
  const max = Math.max(r.high + span * 0.5, r.value);
  const pos = (v: number) => ((v - min) / (max - min)) * 100;
  return (
    <div className="mt-4" aria-hidden>
      <div className="relative h-3 rounded-full bg-muted">
        <div className="absolute inset-y-0 rounded-full bg-green-200 dark:bg-green-900" style={{ left: `${pos(r.low)}%`, width: `${pos(r.high) - pos(r.low)}%` }} />
        <div
          className={cn("absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface", r.flag === "normal" ? "bg-green-600" : r.flag === "critical" ? "bg-red-600" : "bg-coral-500")}
          style={{ left: `${Math.min(98, Math.max(2, pos(r.value)))}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[11px] tabular-nums text-muted-foreground">
        <span>Low {r.low}</span>
        <span>High {r.high}</span>
      </div>
    </div>
  );
}

function ResultDetail({ result: r }: { result: LabResult }) {
  const reviewed = useClinical((s) => s.reviewed);
  const markReviewed = useClinical((s) => s.markReviewed);
  const p = clinicalPatientsById[r.patientId];
  const done = !!r.reviewed || !!reviewed[r.id];
  const trend = r.kind === "lab" ? [...(r.history ?? []), r.value!].map((v, i, arr) => ({ label: i === arr.length - 1 ? "Now" : `-${arr.length - 1 - i}`, value: v })) : [];

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-soft sm:p-6" aria-labelledby="result-title">
      {p && (
        <Link href={`/dashboard/patients/${p.id}`} className="block rounded-xl hover:bg-muted/50">
          <PatientIdentity patient={p} size={40} sub={`${p.mrn} · ${p.age}${p.sex} · ${p.ward ? `${p.ward}, bed ${p.bed}` : "Outpatient"}`} />
        </Link>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <h2 id="result-title" className="text-xl font-extrabold">
          {r.name}
        </h2>
        <Badge variant={r.flag === "normal" ? "green" : r.flag === "critical" ? "red" : "coral"}>{flagLabels[r.flag]}</Badge>
        {done ? <Badge variant="muted">Reviewed</Badge> : <Badge variant="blue">New</Badge>}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Resulted {ago(r.hoursAgo)} · {r.id}
      </p>

      {r.kind === "lab" ? (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className={cn("rounded-2xl p-4", r.flag === "critical" ? "bg-red-50 dark:bg-red-950/50" : r.flag === "normal" ? "bg-surface-2" : "bg-coral-50 dark:bg-orange-950/40")}>
              <p className="text-xs font-semibold text-muted-foreground">Result</p>
              <p className={cn("font-display text-3xl font-extrabold tabular-nums", r.flag === "critical" && "text-red-700 dark:text-red-300")}>
                {r.value} <span className="text-sm font-medium text-muted-foreground">{r.unit}</span>
              </p>
            </div>
            <div className="rounded-2xl bg-surface-2 p-4">
              <p className="text-xs font-semibold text-muted-foreground">Normal range</p>
              <p className="font-display text-3xl font-extrabold tabular-nums">
                {r.low}–{r.high}
              </p>
            </div>
          </div>
          <RangeBar r={r} />
          {trend.length > 1 && (
            <div className="mt-5">
              <p className="text-sm font-bold">Trend</p>
              <div className="mt-2 h-40" role="img" aria-label={`Trend: ${trend.map((t) => t.value).join(", ")} ${r.unit}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                    <CartesianGrid {...chartTheme.grid} />
                    <ReferenceArea y1={r.low} y2={r.high} fill={chartColors.green} fillOpacity={0.1} />
                    <XAxis dataKey="label" {...chartTheme.axis} />
                    <YAxis {...chartTheme.axis} domain={["auto", "auto"]} />
                    <Tooltip {...chartTheme.tooltip} cursor={{ stroke: "var(--border)" }} formatter={(v) => [`${v} ${r.unit}`, r.name]} />
                    <Line type="monotone" dataKey="value" stroke={r.flag === "critical" ? chartColors.red : chartColors.blue} strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-muted-foreground">Green band = normal range. Earlier results on the left.</p>
            </div>
          )}
        </>
      ) : (
        <div className="mt-5 rounded-2xl bg-surface-2 p-4">
          <p className="text-xs font-semibold text-muted-foreground">Report</p>
          <p className="mt-1 text-sm leading-relaxed">{r.report}</p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-5">
        <Button
          disabled={done}
          onClick={() => {
            markReviewed(r.id);
            toast.success("Marked as reviewed", { description: `${r.name} for ${p?.name}` });
          }}
        >
          <CircleCheck aria-hidden /> {done ? "Reviewed" : "Mark reviewed"}
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/messages">
            <MessageCircle aria-hidden /> Message patient
          </Link>
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.success("Follow-up ordered", { description: `Repeat ${r.name} for ${p?.name}. The lab has been told.` })}
        >
          <CalendarPlus aria-hidden /> Order follow-up
        </Button>
        {p && (
          <Button asChild variant="ghost">
            <Link href={`/dashboard/patients/${p.id}`}>
              <FileHeart aria-hidden /> Chart
            </Link>
          </Button>
        )}
      </div>
    </section>
  );
}
