"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, BedDouble, CalendarDays, FlaskConical, NotebookPen, Play, Siren, Stethoscope, Video } from "lucide-react";
import { clinicalPatientsById, doctorPatients, labResults } from "@/data/clinical";
import { useClinical } from "@/store/clinical";
import { formatTime, timeAgo } from "@/lib/dates";
import { chartColors, chartTheme } from "@/lib/chart";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { ClinicalBanner, displayBand, greeting, NewsBadge, PatientIdentity, ResultFlagBadge, bandStyles, useNewsOf } from "@/components/dashboard/clinical/shared";
import { NoteEditorDialog } from "@/components/dashboard/clinical/note-editor";
import { addDays, isVisit, slotStyles, startOfDay, startOfWeek, useSchedule, type ScheduleItem } from "@/components/dashboard/clinical/doctor/use-schedule";

const severity = { critical: 0, high: 1, low: 1, abnormal: 1, normal: 2 } as const;

/** Doctor home: today's clinic, critical patients, results to review and the week at a glance. */
export function DoctorOverview() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const todayItems = useSchedule(today, 1);
  const weekItems = useSchedule(weekStart, 7);
  const notes = useClinical((s) => s.notes);
  const reviewed = useClinical((s) => s.reviewed);
  const setVisitStatus = useClinical((s) => s.setVisitStatus);
  const newsOf = useNewsOf();
  const [editor, setEditor] = useState<{ patientId: string; visitId: string; type: "Clinic visit" | "Video visit" } | null>(null);

  const visitsToday = todayItems.filter(isVisit);
  const onWard = doctorPatients.filter((p) => p.ward);
  const myIds = new Set(doctorPatients.map((p) => p.id));
  const toReview = labResults
    .filter((r) => myIds.has(r.patientId) && !r.reviewed && !reviewed[r.id])
    .sort((a, b) => severity[a.flag] - severity[b.flag] || a.hoursAgo - b.hoursAgo);
  const drafts = notes.filter((n) => n.status === "draft");
  const alerts = doctorPatients
    .map((p) => ({ p, news: newsOf(p) }))
    .filter((x) => x.news >= 5)
    .sort((a, b) => b.news - a.news);

  const chart = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(weekStart, i);
      const items = weekItems.filter((it) => isVisit(it) && new Date(it.start).toDateString() === day.toDateString());
      return {
        day: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(day),
        Clinic: items.filter((it) => it.type === "clinic").length,
        Video: items.filter((it) => it.type === "video").length,
      };
    });
  }, [weekItems, weekStart]);

  const remaining = visitsToday.filter((v) => v.status === "upcoming" || v.status === "checked-in").length;

  return (
    <div className="space-y-6">
      <ClinicalBanner eyebrow="Cardiology · Heart Center" title={`${greeting()}, Dr. Haddad.`}>
        <p className="mt-2 text-brand-100">
          You have {remaining} of {visitsToday.length} visits still to see today
          {alerts.length > 0 && `, and ${alerts.length} patient${alerts.length > 1 ? "s" : ""} on the ward with a high early warning score`}.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild variant="white" size="sm">
            <Link href="/dashboard/schedule">
              <CalendarDays aria-hidden /> Open schedule
            </Link>
          </Button>
          <Button asChild size="sm" className="bg-white/15 text-white ring-1 ring-white/30 hover:bg-white/25">
            <Link href="/dashboard/results">
              <FlaskConical aria-hidden /> Review results
            </Link>
          </Button>
        </div>
      </ClinicalBanner>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's appointments" value={visitsToday.length} icon={CalendarDays} hint={`${remaining} still to see`} />
        <StatCard label="Patients on ward" value={onWard.length} icon={BedDouble} tone="blue" hint={`${alerts.length} need urgent review`} />
        <StatCard label="Results to review" value={toReview.length} icon={FlaskConical} tone={toReview.some((r) => r.flag === "critical") ? "red" : "coral"} hint={`${toReview.filter((r) => r.flag === "critical").length} critical`} />
        <StatCard label="Unsigned notes" value={drafts.length} icon={NotebookPen} tone="violet" hint="Drafts waiting to sign" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Today's timeline"
          description={new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date())}
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/schedule">
                Full schedule <ArrowRight aria-hidden />
              </Link>
            </Button>
          }
          bodyClassName="p-0"
        >
          <ol className="divide-y divide-border">
            {todayItems.map((it) => (
              <TimelineRow
                key={it.id}
                item={it}
                onStart={() =>
                  it.patientId && setEditor({ patientId: it.patientId, visitId: it.id, type: it.type === "video" ? "Video visit" : "Clinic visit" })
                }
              />
            ))}
          </ol>
        </Panel>

        <div className="space-y-6">
          <Panel
            title={
              <span className="flex items-center gap-2">
                <Siren className="size-4 text-red-600" aria-hidden /> Critical alerts
              </span>
            }
            description="NEWS 5 or more needs an urgent review"
            bodyClassName="p-3"
          >
            {alerts.length === 0 ? (
              <p className="p-2 text-sm text-muted-foreground">No patients above the alert line. Nice.</p>
            ) : (
              <ul className="space-y-2">
                {alerts.map(({ p, news }) => (
                  <li key={p.id}>
                    <Link
                      href={`/dashboard/patients/${p.id}`}
                      className={cn("flex items-center gap-3 rounded-xl border p-3 transition-colors hover:border-red-400", bandStyles[displayBand(news)].tile)}
                    >
                      <PatientIdentity patient={p} size={36} sub={`${p.ward} · bed ${p.bed} · ${p.condition}`} className="flex-1" />
                      <NewsBadge score={news} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title="Results needing review"
            description={`${toReview.length} waiting`}
            action={
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/results">
                  Inbox <ArrowRight aria-hidden />
                </Link>
              </Button>
            }
            bodyClassName="p-2"
          >
            <ul>
              {toReview.slice(0, 5).map((r) => {
                const p = clinicalPatientsById[r.patientId];
                return (
                  <li key={r.id}>
                    <Link href={`/dashboard/results?id=${r.id}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/60">
                      <ResultFlagBadge flag={r.flag} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{r.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {p?.name} · {timeAgo(new Date(Date.now() - r.hoursAgo * 3_600_000).toISOString())}
                        </span>
                      </span>
                      {r.kind === "lab" && (
                        <span className={cn("text-sm font-bold tabular-nums", r.flag === "critical" && "text-red-700 dark:text-red-300")}>
                          {r.value} <span className="text-xs font-normal text-muted-foreground">{r.unit}</span>
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
              {toReview.length === 0 && <li className="p-3 text-sm text-muted-foreground">All results reviewed.</li>}
            </ul>
          </Panel>
        </div>
      </div>

      <Panel title="Visits this week" description="Clinic and video visits per day">
        <div className="h-56" role="img" aria-label={`Visits this week: ${chart.map((d) => `${d.day} ${d.Clinic + d.Video}`).join(", ")}`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid {...chartTheme.grid} />
              <XAxis dataKey="day" {...chartTheme.axis} />
              <YAxis allowDecimals={false} {...chartTheme.axis} />
              <Tooltip {...chartTheme.tooltip} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Clinic" stackId="v" fill={chartColors.teal} radius={[0, 0, 4, 4]} />
              <Bar dataKey="Video" stackId="v" fill={chartColors.blue} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <NoteEditorDialog
        open={!!editor}
        onOpenChange={(o) => !o && setEditor(null)}
        patientId={editor?.patientId}
        type={editor?.type}
        onSigned={() => editor && setVisitStatus(editor.visitId, "completed")}
      />
    </div>
  );
}

function TimelineRow({ item, onStart }: { item: ScheduleItem; onStart: () => void }) {
  const p = item.patientId ? clinicalPatientsById[item.patientId] : undefined;
  const visit = isVisit(item);
  const done = item.status === "completed" || item.status === "no-show";
  const end = new Date(new Date(item.start).getTime() + item.duration * 60_000).toISOString();
  return (
    <li className={cn("flex flex-wrap items-center gap-3 px-5 py-3 sm:flex-nowrap", done && "opacity-70")}>
      <div className="w-16 shrink-0 text-sm font-bold tabular-nums">
        {formatTime(item.start)}
        <span className="block text-[11px] font-normal text-muted-foreground">to {formatTime(end)}</span>
      </div>
      <span className={cn("h-10 w-1 shrink-0 rounded-full", slotStyles[item.type].dot)} aria-hidden />
      <div className="min-w-0 flex-1">
        {p ? (
          <Link href={`/dashboard/patients/${p.id}`} className="hover:underline">
            <PatientIdentity patient={p} size={32} sub={item.reason} />
          </Link>
        ) : (
          <p className="text-sm font-semibold">{item.reason}</p>
        )}
      </div>
      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
        {item.type === "video" ? <Video className="size-3.5" aria-hidden /> : <Stethoscope className="size-3.5" aria-hidden />}
        {slotStyles[item.type].label}
      </span>
      {item.status && <StatusBadge status={item.status} />}
      {visit && !done && (
        <Button size="sm" variant={item.status === "checked-in" ? "primary" : "outline"} onClick={onStart} className="ml-auto sm:ml-0">
          <Play aria-hidden /> Start visit
        </Button>
      )}
    </li>
  );
}
