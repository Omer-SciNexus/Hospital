"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, Droplet, FileImage, FileText, HeartPulse, Printer, Syringe, TriangleAlert } from "lucide-react";
import { getDepartment } from "@/config/departments";
import { doctorsById } from "@/data/doctors";
import { demoPatient } from "@/data/patients";
import { chartColors, chartTheme } from "@/lib/chart";
import { formatDay } from "@/lib/dates";
import { formatDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type ColumnDef } from "@/components/dashboard/data-table";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader, Panel } from "@/components/dashboard/page-header";
import { FlagBadge } from "./flag-badge";
import { conditions, documents, labResults, vaccinations, type LabResult } from "./records-data";
import { useMyAppointments } from "./use-patient";

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", year: "2-digit" });

/** Tiny trend line for a table row. Decorative: the row text carries the values. */
function Sparkline({ result }: { result: LabResult }) {
  const color = result.flag === "normal" ? chartColors.teal : chartColors.coral;
  return (
    <div className="h-8 w-24" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={result.history} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const columns: ColumnDef<LabResult, unknown>[] = [
  {
    accessorKey: "name",
    header: "Test",
    cell: ({ row }) => (
      <div className="min-w-32">
        <p className="font-semibold">{row.original.name}</p>
        <p className="text-xs text-muted-foreground">{row.original.panel}</p>
      </div>
    ),
  },
  {
    accessorKey: "value",
    header: "Result",
    cell: ({ row }) => (
      <span className="whitespace-nowrap font-display font-bold tabular-nums">
        {row.original.value} <span className="text-xs font-medium text-muted-foreground">{row.original.unit}</span>
      </span>
    ),
  },
  {
    accessorKey: "range",
    header: "Normal range",
    enableSorting: false,
    meta: { className: "hidden sm:table-cell" },
    cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{row.original.range}</span>,
  },
  { accessorKey: "flag", header: "Flag", cell: ({ row }) => <FlagBadge flag={row.original.flag} /> },
  {
    id: "trend",
    header: "Trend",
    enableSorting: false,
    meta: { className: "hidden md:table-cell" },
    cell: ({ row }) => {
      const h = row.original.history;
      return (
        <div className="flex items-center gap-2">
          <Sparkline result={row.original} />
          <span className="whitespace-nowrap text-xs text-muted-foreground">from {h[0].value}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    meta: { className: "hidden lg:table-cell" },
    cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(row.original.date)}</span>,
  },
];

/** Results & records: lab results, visit summaries, documents, allergies and vaccinations. */
export function RecordsScreen() {
  const [selected, setSelected] = useState<LabResult | null>(null);
  const appointments = useMyAppointments();
  const visits = useMemo(() => appointments.filter((a) => a.status === "completed").reverse(), [appointments]);
  const flagged = labResults.filter((r) => r.flag !== "normal").length;

  return (
    <div>
      <PageHeader
        eyebrow="My health"
        title="Results & records"
        description="Your lab results, visit notes and documents in one place. Ask your care team if anything is unclear."
        actions={
          <Button variant="outline" onClick={() => toast.success("Health summary ready", { description: "maya-robinson-health-summary.pdf" })}>
            <Printer aria-hidden /> Health summary PDF
          </Button>
        }
      />

      <Tabs defaultValue="labs">
        <TabsList aria-label="Record type">
          <TabsTrigger value="labs">Lab results</TabsTrigger>
          <TabsTrigger value="visits">Visit summaries</TabsTrigger>
          <TabsTrigger value="docs">Imaging & documents</TabsTrigger>
          <TabsTrigger value="allergies">Allergies & conditions</TabsTrigger>
          <TabsTrigger value="vaccines">Vaccinations</TabsTrigger>
        </TabsList>

        <TabsContent value="labs" className="space-y-4">
          {flagged > 0 && (
            <p className="flex items-start gap-2 rounded-2xl bg-coral-50 p-4 text-sm text-coral-700 dark:bg-orange-950 dark:text-orange-100">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              {flagged} results are outside the normal range. Your doctor has seen them. Tap a row to read the note.
            </p>
          )}
          <DataTable
            columns={columns}
            data={labResults}
            searchPlaceholder="Search tests…"
            onRowClick={setSelected}
            empty={{ title: "No results", image: "/images/dashboard/empty-records.png" }}
          />
        </TabsContent>

        <TabsContent value="visits">
          {visits.length === 0 ? (
            <Panel>
              <EmptyState image="/images/dashboard/empty-records.png" title="No visit summaries yet" description="After each visit your doctor writes a short summary here." />
            </Panel>
          ) : (
            <ul className="grid gap-4 lg:grid-cols-2">
              {visits.map((a) => {
                const doctor = doctorsById[a.doctorId];
                return (
                  <li key={a.id} className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
                    <div className="flex items-center gap-3">
                      <Avatar name={doctor?.name ?? "Doctor"} src={doctor?.photo} size={44} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{a.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          {doctor?.name} · {doctor ? getDepartment(doctor.department)?.name : ""} · {formatDay(a.start)}
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 rounded-xl bg-surface-2 p-3 text-sm leading-relaxed">{a.summary ?? "No summary was added for this visit."}</p>
                    <Button
                      size="sm"
                      variant="link"
                      className="mt-3"
                      onClick={() => toast.success("Visit summary downloaded", { description: `${a.id}-summary.pdf` })}
                    >
                      <Download aria-hidden /> Download
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="docs">
          <Panel bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {documents.map((d) => (
                <li key={d.id} className="flex items-center gap-3 px-5 py-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
                    {d.kind === "Imaging" ? <FileImage className="size-5" aria-hidden /> : <FileText className="size-5" aria-hidden />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{d.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.kind} · {d.author} · {formatDate(d.date)} · {d.size}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Download ${d.title}`}
                    onClick={() => toast.success("Download started", { description: d.title })}
                  >
                    <Download aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          </Panel>
        </TabsContent>

        <TabsContent value="allergies" className="grid gap-6 lg:grid-cols-2">
          <Panel title="Allergies" description="Shown to every doctor and pharmacist before they prescribe">
            {demoPatient.allergies.length === 0 ? (
              <p className="text-sm text-muted-foreground">No known allergies.</p>
            ) : (
              <ul className="space-y-2">
                {demoPatient.allergies.map((a) => (
                  <li key={a} className="flex items-center gap-3 rounded-xl bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">
                    <TriangleAlert className="size-4 shrink-0" aria-hidden />
                    <span className="flex-1 font-semibold">{a}</span>
                    <Badge variant="red">Severe: rash and swelling</Badge>
                  </li>
                ))}
              </ul>
            )}
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-surface-2 p-3">
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Droplet className="size-3.5" aria-hidden /> Blood type
                </dt>
                <dd className="font-display text-lg font-bold">{demoPatient.bloodType}</dd>
              </div>
              <div className="rounded-xl bg-surface-2 p-3">
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <HeartPulse className="size-3.5" aria-hidden /> Latest vitals
                </dt>
                <dd className="font-semibold">
                  BP {demoPatient.vitals.bp} · HR {demoPatient.vitals.hr}
                </dd>
              </div>
            </dl>
          </Panel>
          <Panel title="Conditions" description="Kept up to date by your doctors">
            <ul className="space-y-3">
              {conditions.map((c) => (
                <li key={c.name} className="rounded-xl border border-border p-3">
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.since} · {c.status}
                  </p>
                </li>
              ))}
            </ul>
          </Panel>
        </TabsContent>

        <TabsContent value="vaccines">
          <Panel bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {vaccinations.map((v) => (
                <li key={v.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-200">
                    <Syringe className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{v.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.dose} · {formatDate(v.date)} · {v.givenAt}
                    </p>
                  </div>
                  {v.due ? <Badge variant="blue">Next due {shortDate(v.due)}</Badge> : <Badge variant="green">Complete</Badge>}
                </li>
              ))}
            </ul>
          </Panel>
        </TabsContent>
      </Tabs>

      <ResultDialog result={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function ResultDialog({ result, onClose }: { result: LabResult | null; onClose: () => void }) {
  return (
    <Dialog open={!!result} onOpenChange={(o) => !o && onClose()}>
      {result && (
        <DialogContent size="lg">
          <DialogTitle>{result.name}</DialogTitle>
          <DialogDescription>
            {result.panel} · ordered by {result.orderedBy} · {formatDate(result.date)}
          </DialogDescription>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <p className="font-display text-4xl font-extrabold tabular-nums">
              {result.value} <span className="text-base font-medium text-muted-foreground">{result.unit}</span>
            </p>
            <FlagBadge flag={result.flag} />
            <p className="text-sm text-muted-foreground">Normal: {result.range}</p>
          </div>
          {result.note && <p className="mt-4 rounded-xl bg-surface-2 p-3 text-sm">{result.note}</p>}
          <figure className="mt-5">
            <figcaption className="mb-2 text-sm font-semibold">Your last {result.history.length} results</figcaption>
            <div className="h-56" aria-hidden>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.history.map((h) => ({ ...h, label: shortDate(h.date) }))} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid {...chartTheme.grid} />
                  {result.low !== undefined && result.high !== undefined && (
                    <ReferenceArea y1={result.low} y2={result.high} fill={chartColors.green} fillOpacity={0.08} />
                  )}
                  <XAxis dataKey="label" {...chartTheme.axis} />
                  <YAxis {...chartTheme.axis} domain={["auto", "auto"]} />
                  <Tooltip {...chartTheme.tooltip} cursor={{ stroke: "var(--border)" }} formatter={(v: number) => [`${v} ${result.unit}`, result.name]} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={chartColors.teal}
                    strokeWidth={2}
                    dot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)", fill: chartColors.teal }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <ul className="sr-only">
              {result.history.map((h) => (
                <li key={h.date}>
                  {formatDate(h.date)}: {h.value} {result.unit}
                </li>
              ))}
            </ul>
            {result.low !== undefined && result.high !== undefined && (
              <p className="mt-2 text-xs text-muted-foreground">The shaded band is the normal range.</p>
            )}
          </figure>
          <DialogFooter>
            <Button variant="outline" onClick={() => toast.success("Download started", { description: `${result.name} history` })}>
              <Download aria-hidden /> Download
            </Button>
            <DialogClose asChild>
              <Button>Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
