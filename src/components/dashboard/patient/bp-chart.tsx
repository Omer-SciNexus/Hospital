"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartColors, chartTheme } from "@/lib/chart";
import { homeBloodPressure } from "./records-data";

const series = [
  { key: "systolic", label: "Systolic (top)", color: chartColors.teal },
  { key: "diastolic", label: "Diastolic (bottom)", color: chartColors.blue },
] as const;

/** 14 days of home blood pressure readings, with a legend and a hidden table for screen readers. */
export function BloodPressureChart({ height = 200 }: { height?: number }) {
  const last = homeBloodPressure.at(-1)!;
  return (
    <figure>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full" style={{ background: s.color }} aria-hidden />
            {s.label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0 w-4 border-t border-dashed border-muted-foreground" aria-hidden />
          Target 130/80
        </span>
      </div>
      <div style={{ height }} aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={homeBloodPressure} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid {...chartTheme.grid} />
            <XAxis dataKey="day" {...chartTheme.axis} interval="preserveStartEnd" minTickGap={24} />
            <YAxis {...chartTheme.axis} domain={[70, 150]} ticks={[80, 100, 120, 140]} />
            <Tooltip {...chartTheme.tooltip} cursor={{ stroke: "var(--border)" }} formatter={(v: number, name: string) => [`${v} mmHg`, name]} />
            <ReferenceLine y={130} stroke="var(--muted-foreground)" strokeDasharray="4 4" strokeOpacity={0.6} />
            <ReferenceLine y={80} stroke="var(--muted-foreground)" strokeDasharray="4 4" strokeOpacity={0.6} />
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="mt-2 text-xs text-muted-foreground">
        Latest reading <span className="font-semibold text-foreground">{last.systolic}/{last.diastolic} mmHg</span>, down from{" "}
        {homeBloodPressure[0].systolic}/{homeBloodPressure[0].diastolic} two weeks ago.
      </figcaption>
      <div className="sr-only">
        <table>
          <caption>Home blood pressure, last 14 days</caption>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Systolic</th>
              <th scope="col">Diastolic</th>
            </tr>
          </thead>
          <tbody>
            {homeBloodPressure.map((r) => (
              <tr key={r.day}>
                <td>{r.day}</td>
                <td>{r.systolic}</td>
                <td>{r.diastolic}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
