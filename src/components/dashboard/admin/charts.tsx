"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartColors, chartTheme } from "@/lib/chart";
import { revenueStreams, type StreamKey } from "@/data/operations";
import { ChartFigure, ChartLegend, compact, money, number } from "./chart-kit";

/** Neutral gray for "previous period", "passives", "other": never a series hue. */
export const neutral = "#94a3b8";

export const streamColors: Record<StreamKey, string> = {
  inpatient: chartColors.teal,
  outpatient: chartColors.blue,
  pharmacy: chartColors.coral,
  lab: chartColors.violet,
  marketplace: chartColors.green,
};

const lineCursor = { stroke: "var(--muted-foreground)", strokeWidth: 1, strokeDasharray: "0" };
const surfaceGap = { stroke: "var(--surface)", strokeWidth: 2 };

/* ------------------------------------------------------------ admissions */

export function AdmissionsChart({ data }: { data: { label: string; admissions: number; discharges: number }[] }) {
  const tA = data.reduce((s, d) => s + d.admissions, 0);
  const tD = data.reduce((s, d) => s + d.discharges, 0);
  return (
    <>
      <ChartLegend
        className="mb-3"
        items={[
          { label: "Admissions", color: chartColors.teal, value: number(tA) },
          { label: "Discharges", color: chartColors.blue, value: number(tD) },
        ]}
      />
      <ChartFigure
        summary={`Admissions and discharges over ${data.length} days: ${tA} admissions and ${tD} discharges.`}
        table={{ caption: "Admissions and discharges per day", head: ["Day", "Admissions", "Discharges"], rows: data.map((d) => [d.label, d.admissions, d.discharges]) }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="adm-a" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColors.teal} stopOpacity={0.18} />
                <stop offset="100%" stopColor={chartColors.teal} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="adm-d" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColors.blue} stopOpacity={0.12} />
                <stop offset="100%" stopColor={chartColors.blue} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid {...chartTheme.grid} />
            <XAxis dataKey="label" {...chartTheme.axis} interval="preserveStartEnd" minTickGap={16} />
            <YAxis {...chartTheme.axis} width={48} domain={["dataMin - 10", "dataMax + 6"]} allowDecimals={false} />
            <Tooltip {...chartTheme.tooltip} cursor={lineCursor} />
            <Area type="monotone" dataKey="admissions" name="Admissions" stroke={chartColors.teal} strokeWidth={2} fill="url(#adm-a)" activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }} />
            <Area type="monotone" dataKey="discharges" name="Discharges" stroke={chartColors.blue} strokeWidth={2} fill="url(#adm-d)" activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartFigure>
    </>
  );
}

/* ------------------------------------------------------- revenue streams */

type StreamRow = { label: string } & Record<StreamKey, number>;

export function RevenueStreamsChart({ data, variant = "bar", height = 260 }: { data: StreamRow[]; variant?: "bar" | "area"; height?: number }) {
  const totals = revenueStreams.map((s) => ({ ...s, total: data.reduce((a, d) => a + d[s.key], 0) }));
  const grand = totals.reduce((a, t) => a + t.total, 0);
  const legend = totals.map((t) => ({ label: t.label, color: streamColors[t.key], value: money(t.total) }));
  const table = {
    caption: "Revenue by stream",
    head: ["Period", ...revenueStreams.map((s) => s.label)],
    rows: data.map((d) => [d.label, ...revenueStreams.map((s) => money(d[s.key]))]),
  };
  const tooltip = (
    <Tooltip
      {...chartTheme.tooltip}
      cursor={variant === "area" ? lineCursor : chartTheme.tooltip.cursor}
      formatter={(v) => money(Number(v))}
    />
  );
  return (
    <>
      <ChartLegend className="mb-3" items={legend} />
      <ChartFigure summary={`Revenue by stream, ${money(grand)} in total. Largest stream: inpatient at ${money(totals[0].total)}.`} height={height} table={table}>
        <ResponsiveContainer width="100%" height="100%">
          {variant === "bar" ? (
            <BarChart data={data} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
              <CartesianGrid {...chartTheme.grid} />
              <XAxis dataKey="label" {...chartTheme.axis} interval="preserveStartEnd" minTickGap={8} />
              <YAxis {...chartTheme.axis} width={56} tickFormatter={(v) => money(v, 0)} />
              {tooltip}
              {revenueStreams.map((s, i) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  stackId="rev"
                  fill={streamColors[s.key]}
                  maxBarSize={24}
                  {...surfaceGap}
                  radius={i === revenueStreams.length - 1 ? [4, 4, 0, 0] : 0}
                />
              ))}
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
              <CartesianGrid {...chartTheme.grid} />
              <XAxis dataKey="label" {...chartTheme.axis} interval="preserveStartEnd" minTickGap={16} />
              <YAxis {...chartTheme.axis} width={56} tickFormatter={(v) => money(v, 0)} />
              {tooltip}
              {revenueStreams.map((s) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stackId="rev"
                  stroke={streamColors[s.key]}
                  strokeWidth={2}
                  fill={streamColors[s.key]}
                  fillOpacity={0.14}
                />
              ))}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </ChartFigure>
    </>
  );
}

/* ------------------------------------------------------------- beds/group */

export function BedsByGroupChart({ data }: { data: { name: string; beds: number; occupied: number; pct: number }[] }) {
  return (
    <ChartFigure
      summary={`Bed occupancy by department group. ${data.map((d) => `${d.name} ${d.pct}%`).join(", ")}.`}
      height={data.length * 44 + 16}
      table={{ caption: "Bed occupancy by department group", head: ["Group", "Occupied", "Beds", "Occupancy"], rows: data.map((d) => [d.name, d.occupied, d.beds, `${d.pct}%`]) }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }}>
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis type="category" dataKey="name" {...chartTheme.axis} width={128} />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v, _n, item) => [`${v}% (${item.payload.occupied} of ${item.payload.beds} beds)`, "Occupancy"]}
          />
          <Bar dataKey="pct" name="Occupancy" fill={chartColors.teal} maxBarSize={18} radius={[0, 4, 4, 0]} background={{ fill: "var(--muted)", radius: 4 }}>
            <LabelList dataKey="pct" position="right" formatter={(v: number) => `${v}%`} style={{ fill: "var(--foreground)", fontSize: 12, fontWeight: 700 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFigure>
  );
}

/* ---------------------------------------------------------------- visits */

export function VisitsTrendChart({ data, rangeLabel }: { data: { label: string; visits: number; prevVisits: number }[]; rangeLabel: string }) {
  const cur = data.reduce((s, d) => s + d.visits, 0);
  const prev = data.reduce((s, d) => s + d.prevVisits, 0);
  const last = data.at(-1);
  return (
    <>
      <ChartLegend
        className="mb-3"
        items={[
          { label: `This period`, color: chartColors.teal, value: compact(cur) },
          { label: "Previous period", color: neutral, dashed: true, value: compact(prev) },
        ]}
      />
      <ChartFigure
        summary={`Patient visits, ${rangeLabel}: ${number(cur)} visits compared with ${number(prev)} in the previous period.`}
        height={280}
        table={{ caption: "Patient visits", head: ["Period", "Visits", "Previous period"], rows: data.map((d) => [d.label, d.visits, d.prevVisits]) }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 16, right: 40, left: -8, bottom: 0 }}>
            <CartesianGrid {...chartTheme.grid} />
            <XAxis dataKey="label" {...chartTheme.axis} interval="preserveStartEnd" minTickGap={16} />
            <YAxis {...chartTheme.axis} width={52} tickFormatter={compact} />
            <Tooltip {...chartTheme.tooltip} cursor={lineCursor} formatter={(v) => number(Number(v))} />
            <Line type="monotone" dataKey="prevVisits" name="Previous period" stroke={neutral} strokeWidth={2} strokeDasharray="5 4" dot={false} activeDot={{ r: 4 }} />
            <Line
              type="monotone"
              dataKey="visits"
              name="This period"
              stroke={chartColors.teal}
              strokeWidth={2}
              strokeLinecap="round"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--surface)" }}
            >
              {last && (
                <LabelList
                  dataKey="visits"
                  content={({ x, y, index, value }) =>
                    index === data.length - 1 ? (
                      <text x={Number(x) + 6} y={Number(y) - 8} fontSize={12} fontWeight={700} fill="var(--foreground)">
                        {compact(Number(value))}
                      </text>
                    ) : null
                  }
                />
              )}
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </ChartFigure>
    </>
  );
}

/* ------------------------------------------------------------------ donut */

export function Donut({
  data,
  center,
  centerLabel,
  summary,
  caption,
  valueSuffix = "%",
  size = 200,
}: {
  data: { name: string; value: number; color: string }[];
  center: string;
  centerLabel: string;
  summary: string;
  caption: string;
  valueSuffix?: string;
  size?: number;
}) {
  return (
    <ChartFigure
      summary={summary}
      height={size}
      table={{ caption, head: ["Segment", "Share"], rows: data.map((d) => [d.name, `${d.value}${valueSuffix}`]) }}
      className="relative"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip {...chartTheme.tooltip} formatter={(v) => `${v}${valueSuffix}`} />
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="66%" outerRadius="94%" paddingAngle={1} stroke="var(--surface)" strokeWidth={2} startAngle={90} endAngle={-270}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center text-center" style={{ height: size }}>
        <div>
          <p className="font-display text-3xl font-extrabold">{center}</p>
          <p className="text-xs font-medium text-muted-foreground">{centerLabel}</p>
        </div>
      </div>
    </ChartFigure>
  );
}

/* ------------------------------------------------------------- categories */

export function CategoriesChart({ data }: { data: { name: string; revenue: number }[] }) {
  const top = data.slice(0, 7);
  return (
    <ChartFigure
      summary={`Top marketplace categories by revenue. Leader: ${top[0]?.name} with ${money(top[0]?.revenue ?? 0)}.`}
      height={top.length * 38 + 8}
      table={{ caption: "Marketplace revenue by category", head: ["Category", "Revenue"], rows: data.map((d) => [d.name, money(d.revenue)]) }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={top} layout="vertical" margin={{ top: 0, right: 56, left: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" {...chartTheme.axis} width={116} />
          <Tooltip {...chartTheme.tooltip} formatter={(v) => [money(Number(v)), "Revenue"]} />
          <Bar dataKey="revenue" name="Revenue" fill={chartColors.teal} maxBarSize={18} radius={[0, 4, 4, 0]}>
            <LabelList dataKey="revenue" position="right" formatter={(v: number) => money(v)} style={{ fill: "var(--foreground)", fontSize: 12, fontWeight: 700 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFigure>
  );
}

/* --------------------------------------------------------- mini sparkline */

export function MiniTrend({ data, name }: { data: { label: string; patients: number }[]; name: string }) {
  const first = data[0]?.patients ?? 0;
  const last = data.at(-1)?.patients ?? 0;
  return (
    <ChartFigure
      summary={`${name}: patients per day over 14 days, from ${first} to ${last}.`}
      height={140}
      table={{ caption: `${name} patients per day`, head: ["Day", "Patients"], rows: data.map((d) => [d.label, d.patients]) }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid {...chartTheme.grid} />
          <XAxis dataKey="label" {...chartTheme.axis} interval="preserveStartEnd" minTickGap={24} />
          <YAxis {...chartTheme.axis} width={44} allowDecimals={false} domain={["dataMin - 5", "dataMax + 5"]} />
          <Tooltip {...chartTheme.tooltip} cursor={lineCursor} />
          <Area type="monotone" dataKey="patients" name="Patients" stroke={chartColors.teal} strokeWidth={2} fill={chartColors.teal} fillOpacity={0.1} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFigure>
  );
}
