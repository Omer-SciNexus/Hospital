"use client";

import { useMemo, useState } from "react";
import { CircleDollarSign, Download, Hourglass, Star, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { departmentGroups } from "@/config/departments";
import { site } from "@/config/site";
import {
  departmentPerformance,
  erHeatmap,
  payerMix,
  pctChange,
  ranges,
  rangeSeries,
  rangeTotals,
  satisfaction,
  topCategories,
  weekdays,
  type RangeId,
} from "@/data/operations";
import { chartColors, chartSeries } from "@/lib/chart";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, Panel } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { DataTable, type ColumnDef } from "@/components/dashboard/data-table";
import { CategoriesChart, Donut, neutral, RevenueStreamsChart, VisitsTrendChart } from "./charts";
import { ChartLegend, compact, money, number } from "./chart-kit";

type PerfRow = ReturnType<typeof departmentPerformance>[number];

const groupName = Object.fromEntries(departmentGroups.map((g) => [g.id, g.name])) as Record<string, string>;

const perfColumns: ColumnDef<PerfRow, unknown>[] = [
  {
    accessorKey: "name",
    header: "Department",
    cell: ({ row }) => (
      <div className="min-w-36">
        <p className="font-semibold">{row.original.name}</p>
        <p className="text-xs text-muted-foreground">{groupName[row.original.group]}</p>
      </div>
    ),
  },
  { accessorKey: "visits", header: "Visits", cell: ({ getValue }) => <span className="tabular-nums">{number(getValue() as number)}</span> },
  {
    accessorKey: "avgWait",
    header: "Avg wait",
    meta: { className: "hidden sm:table-cell" },
    cell: ({ getValue }) => {
      const v = getValue() as number;
      return <span className="tabular-nums">{v ? `${v} min` : "No queue"}</span>;
    },
  },
  {
    accessorKey: "satisfaction",
    header: "Rating",
    meta: { className: "hidden md:table-cell" },
    cell: ({ getValue }) => (
      <span className="inline-flex items-center gap-1 tabular-nums">
        <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
        {(getValue() as number).toFixed(1)}
      </span>
    ),
  },
  { accessorKey: "revenue", header: "Revenue", cell: ({ getValue }) => <span className="font-semibold tabular-nums">{money(getValue() as number)}</span> },
];

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Hospital analytics: KPIs, trends, departments, satisfaction, payers and ER wait patterns for a date range. */
export function AdminAnalytics() {
  const [range, setRange] = useState<RangeId>("30d");
  const r = ranges.find((x) => x.id === range)!;

  const series = useMemo(() => rangeSeries(range), [range]);
  const totals = useMemo(() => rangeTotals(range), [range]);
  const perf = useMemo(() => departmentPerformance(range).sort((a, b) => b.visits - a.visits), [range]);
  const sat = useMemo(() => satisfaction(range), [range]);
  const cats = useMemo(() => topCategories(range), [range]);
  const payers = useMemo(() => payerMix(range), [range]);
  const heat = useMemo(() => erHeatmap(range), [range]);

  const { current: c, previous: p } = totals;

  function exportCsv() {
    downloadCsv(`department-performance-${range}.csv`, [
      ["Department", "Group", "Visits", "Avg wait (min)", "Rating", "Revenue (USD)"],
      ...perf.map((d) => [d.name, groupName[d.group], d.visits, d.avgWait, d.satisfaction, d.revenue]),
    ]);
    toast.success("CSV downloaded", { description: `${perf.length} departments, ${r.long}.` });
  }

  const payerColors = [...chartSeries.slice(0, 6), neutral];

  return (
    <Tabs value={range} onValueChange={(v) => setRange(v as RangeId)}>
      <PageHeader
        eyebrow="Analytics"
        title="Hospital performance"
        description={`How ${site.name} is doing across visits, revenue, departments and patient experience.`}
        actions={
          <>
            <TabsList aria-label="Date range">
              {ranges.map((x) => (
                <TabsTrigger key={x.id} value={x.id}>
                  {x.id}
                  <span className="sr-only"> ({x.label})</span>
                </TabsTrigger>
              ))}
            </TabsList>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download aria-hidden /> Export CSV
            </Button>
          </>
        }
      />

      <TabsContent value={range} className="mt-0 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Patient visits" value={compact(c.visits)} icon={Users} tone="brand" delta={pctChange(c.visits, p.visits)} hint={`vs previous ${r.label}`} />
          <StatCard label="Revenue" value={money(c.revenue)} icon={CircleDollarSign} tone="green" delta={pctChange(c.revenue, p.revenue)} hint={`vs previous ${r.label}`} />
          <StatCard label="Admissions" value={number(c.admissions)} icon={UserPlus} tone="blue" delta={pctChange(c.admissions, p.admissions)} hint={`${number(c.discharges)} discharged`} />
          <StatCard label="Avg ER wait" value={`${c.erWait} min`} icon={Hourglass} tone="coral" delta={pctChange(c.erWait, p.erWait)} goodWhen="down" hint={`${compact(c.erVisits)} ER visits`} />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Panel title="Patient visits" description={`${r.long[0].toUpperCase()}${r.long.slice(1)}, dashed line is the period before`} className="xl:col-span-2">
            <VisitsTrendChart data={series} rangeLabel={r.long} />
          </Panel>
          <Panel title="Patient satisfaction" description={`${number(sat.responses)} survey answers`}>
            <Donut
              data={[
                { name: "Promoters (9–10)", value: sat.promoters, color: chartColors.teal },
                { name: "Passives (7–8)", value: sat.passives, color: neutral },
                { name: "Detractors (0–6)", value: sat.detractors, color: chartColors.coral },
              ]}
              center={`+${sat.nps}`}
              centerLabel="Net promoter score"
              summary={`Net promoter score ${sat.nps}, ${sat.nps - sat.prevNps >= 0 ? "up" : "down"} ${Math.abs(sat.nps - sat.prevNps)} points. ${sat.promoters}% promoters, ${sat.passives}% passives, ${sat.detractors}% detractors.`}
              caption="Survey answers by group"
              size={180}
            />
            <ChartLegend
              className="mt-3 justify-center"
              items={[
                { label: "Promoters", color: chartColors.teal, value: `${sat.promoters}%` },
                { label: "Passives", color: neutral, value: `${sat.passives}%` },
                { label: "Detractors", color: chartColors.coral, value: `${sat.detractors}%` },
              ]}
            />
            <p className="mt-2 text-center text-xs text-muted-foreground">
              NPS {sat.nps - sat.prevNps >= 0 ? "up" : "down"} {Math.abs(sat.nps - sat.prevNps)} points vs previous period
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-4 text-sm">
              {sat.areas.map((a) => (
                <li key={a.label} className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">{a.label}</span>
                  <span className="font-semibold tabular-nums">{a.score.toFixed(1)}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Panel title="Revenue by stream" description={`${money(c.revenue)} in the ${r.long}`} className="xl:col-span-2">
            <RevenueStreamsChart data={series} variant={range === "7d" ? "bar" : "area"} height={280} />
          </Panel>
          <Panel title="Payer mix" description="Share of billed revenue by insurer">
            <Donut
              data={payers.map((x, i) => ({ name: x.name, value: x.share, color: payerColors[i] }))}
              center={`${100 - (payers.find((x) => x.id === "self-pay")?.share ?? 0)}%`}
              centerLabel="Insured"
              summary={`Payer mix: ${payers.map((x) => `${x.name} ${x.share}%`).join(", ")}.`}
              caption="Payer mix"
              size={180}
            />
            <ul className="mt-4 space-y-1.5 text-sm">
              {payers.map((x, i) => (
                <li key={x.id} className="flex items-center gap-2">
                  <span aria-hidden className="size-2.5 shrink-0 rounded-[3px]" style={{ background: payerColors[i] }} />
                  <span className="flex-1 truncate text-muted-foreground">{x.name}</span>
                  <span className="font-semibold tabular-nums">{x.share}%</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <section aria-labelledby="dept-perf-title">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="dept-perf-title" className="text-base font-bold">
                Department performance
              </h2>
              <p className="text-xs text-muted-foreground">Click a column to sort. Export saves this table as a CSV file.</p>
            </div>
          </div>
          <DataTable
            columns={perfColumns}
            data={perf}
            searchPlaceholder="Search departments"
            pageSize={10}
            toolbar={
              <Button variant="soft" size="sm" onClick={exportCsv}>
                <Download aria-hidden /> Export CSV
              </Button>
            }
          />
        </section>

        <div className="grid gap-6 xl:grid-cols-5">
          <Panel title="Top marketplace categories" description={`Revenue, ${r.long}`} className="xl:col-span-2">
            <CategoriesChart data={cats} />
          </Panel>
          <Panel title="ER waits by hour" description="Average minutes from arrival to first doctor" className="xl:col-span-3">
            <div id="er-heatmap" className="scroll-mt-24">
              <ErHeatmap data={heat} />
            </div>
          </Panel>
        </div>
      </TabsContent>
    </Tabs>
  );
}

/* ------------------------------------------------------------------ heatmap */

const heatSteps = [
  { max: 12, label: "Under 12", cls: "bg-brand-100 dark:bg-brand-900" },
  { max: 18, label: "12–17", cls: "bg-brand-200 dark:bg-brand-800" },
  { max: 24, label: "18–23", cls: "bg-brand-400 dark:bg-brand-600" },
  { max: 30, label: "24–29", cls: "bg-brand-600 dark:bg-brand-400" },
  { max: Infinity, label: "30+", cls: "bg-brand-800 dark:bg-brand-200" },
];

const stepFor = (v: number) => heatSteps.find((s) => v < s.max)!;

function ErHeatmap({ data }: { data: ReturnType<typeof erHeatmap> }) {
  let peak = { day: "", hour: 0, v: 0 };
  data.forEach((row) => row.hours.forEach((v, hour) => v > peak.v && (peak = { day: row.day, hour, v })));
  return (
    <div>
      <p className="mb-3 text-sm">
        Longest waits: <span className="font-semibold">{peak.day} around {String(peak.hour).padStart(2, "0")}:00</span> ({peak.v} min).
      </p>
      <div className="relative overflow-x-auto pb-1">
        <table className="w-full min-w-[560px] border-separate border-spacing-[2px] text-xs">
          <caption className="sr-only">Average ER wait in minutes by weekday and hour</caption>
          <thead>
            <tr>
              <th scope="col" className="w-10">
                <span className="sr-only">Day</span>
              </th>
              {Array.from({ length: 24 }, (_, h) => (
                <th key={h} scope="col" className="font-medium text-muted-foreground">
                  <span aria-hidden>{h % 3 === 0 ? String(h).padStart(2, "0") : ""}</span>
                  <span className="sr-only">{String(h).padStart(2, "0")}:00</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.day}>
                <th scope="row" className="pr-2 text-left font-semibold text-muted-foreground">
                  {row.day}
                </th>
                {row.hours.map((v, h) => {
                  const title = `${row.day} ${String(h).padStart(2, "0")}:00, ${v} min`;
                  return (
                    <td key={h} title={title} className={cn("h-7 rounded-[4px] transition-transform hover:scale-110", stepFor(v).cls)}>
                      <span className="sr-only">{v} min</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        <span>Minutes:</span>
        {heatSteps.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5">
            <span aria-hidden className={cn("size-3 rounded-[3px]", s.cls)} />
            {s.label}
          </span>
        ))}
      </div>
      <p className="sr-only">Days: {weekdays.join(", ")}.</p>
    </div>
  );
}
