"use client";

import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { vitalsHistory, type VitalsPoint } from "@/data/clinical";
import type { Patient } from "@/data/patients";
import { useClinical } from "@/store/clinical";
import { chartColors, chartTheme } from "@/lib/chart";

const label = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));

/** 48 h of seeded readings plus anything the nurses recorded since. */
export function usePatientVitals(patient: Patient): (VitalsPoint & { label: string; recorded?: boolean })[] {
  const entries = useClinical((s) => s.vitals);
  return useMemo(() => {
    const seeded = vitalsHistory(patient).map((v) => ({ ...v, label: label(v.at) }));
    const mine = entries
      .filter((e) => e.patientId === patient.id)
      .map((e) => ({ at: e.at, hr: e.hr, sys: e.sys, dia: e.dia, spo2: e.spo2, temp: e.temp, rr: e.rr, news: e.news, label: label(e.at), recorded: true }));
    return [...seeded, ...mine].sort((a, b) => a.at.localeCompare(b.at));
  }, [patient, entries]);
}

type Series = { key: keyof VitalsPoint; name: string; color: string };

export function MiniChart({
  title,
  unit,
  data,
  series,
  domain,
  refLine,
}: {
  title: string;
  unit: string;
  data: ReturnType<typeof usePatientVitals>;
  series: Series[];
  domain?: [number, number];
  refLine?: { y: number; label: string };
}) {
  const last = data.at(-1);
  const summary = series.map((s) => `${s.name} ${last?.[s.key] ?? "-"}`).join(", ");
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold">{title}</h3>
        <p className="text-sm font-extrabold tabular-nums">
          {series.map((s) => last?.[s.key]).join("/")} <span className="text-xs font-normal text-muted-foreground">{unit}</span>
        </p>
      </div>
      <div className="h-44" role="img" aria-label={`${title} over the last 48 hours. Latest: ${summary} ${unit}.`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid {...chartTheme.grid} />
            <XAxis dataKey="label" {...chartTheme.axis} fontSize={10} interval="preserveStartEnd" minTickGap={24} />
            <YAxis {...chartTheme.axis} fontSize={10} domain={domain ?? ["auto", "auto"]} />
            <Tooltip {...chartTheme.tooltip} cursor={{ stroke: "var(--border)" }} />
            {refLine && (
              <ReferenceLine y={refLine.y} stroke={chartColors.red} strokeDasharray="4 4" label={{ value: refLine.label, position: "insideTopRight", fontSize: 10, fill: chartColors.red }} />
            )}
            {series.map((s) => (
              <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Line charts for heart rate, blood pressure, SpO2, temperature and NEWS. */
export function VitalsCharts({ patient }: { patient: Patient }) {
  const data = usePatientVitals(patient);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <MiniChart title="Heart rate" unit="bpm" data={data} series={[{ key: "hr", name: "HR", color: chartColors.coral }]} refLine={{ y: 110, label: "110" }} />
      <MiniChart
        title="Blood pressure"
        unit="mmHg"
        data={data}
        series={[
          { key: "sys", name: "Systolic", color: chartColors.blue },
          { key: "dia", name: "Diastolic", color: chartColors.violet },
        ]}
        refLine={{ y: 90, label: "Sys 90" }}
      />
      <MiniChart title="Oxygen saturation" unit="%" data={data} series={[{ key: "spo2", name: "SpO2", color: chartColors.teal }]} domain={[84, 100]} refLine={{ y: 94, label: "94%" }} />
      <MiniChart title="Temperature" unit="°C" data={data} series={[{ key: "temp", name: "Temp", color: chartColors.amber }]} domain={[35, 40]} refLine={{ y: 38, label: "38 °C" }} />
      <MiniChart title="Respiration rate" unit="/min" data={data} series={[{ key: "rr", name: "RR", color: chartColors.green }]} refLine={{ y: 21, label: "21" }} />
      <MiniChart title="NEWS trend" unit="score" data={data} series={[{ key: "news", name: "NEWS", color: chartColors.red }]} domain={[0, 12]} refLine={{ y: 5, label: "Urgent review (5)" }} />
    </div>
  );
}
