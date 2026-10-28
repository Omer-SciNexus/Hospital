"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { BellRing, FileHeart, Save, TriangleAlert } from "lucide-react";
import { allAdmitted, avpuLabels, clinicalDetail, getClinicalPatient, HOME_WARD, newsBandLabels, newsScore, parseBp, type Avpu } from "@/data/clinical";
import type { Patient } from "@/data/patients";
import { useClinical } from "@/store/clinical";
import { formatDay, formatTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, NativeSelect } from "@/components/ui/form-controls";
import { PageHeader, Panel } from "@/components/dashboard/page-header";
import { AllergyBadges, bandStyles, NewsBadge, PatientIdentity, SafetyFlags } from "../shared";
import { MiniChart, usePatientVitals } from "../chart/vitals-charts";

const num = (label: string, min: number, max: number) =>
  z.number({ error: `Enter ${label}` }).min(min, `${label} looks too low (min ${min})`).max(max, `${label} looks too high (max ${max})`);

const schema = z
  .object({
    hr: num("heart rate", 20, 250),
    sys: num("systolic BP", 50, 260),
    dia: num("diastolic BP", 20, 160),
    spo2: num("SpO2", 50, 100),
    temp: num("temperature", 32, 43),
    rr: num("respiration rate", 4, 60),
    avpu: z.enum(["A", "C", "V", "P", "U"]),
    pain: z.number().min(0).max(10),
    onOxygen: z.boolean(),
  })
  .refine((v) => v.dia < v.sys, { path: ["dia"], message: "Diastolic must be lower than systolic" });

type Values = z.infer<typeof schema>;

const fields: { key: "hr" | "sys" | "dia" | "spo2" | "temp" | "rr"; label: string; unit: string; step?: string }[] = [
  { key: "hr", label: "Heart rate", unit: "bpm" },
  { key: "sys", label: "BP systolic", unit: "mmHg" },
  { key: "dia", label: "BP diastolic", unit: "mmHg" },
  { key: "spo2", label: "SpO2", unit: "%" },
  { key: "temp", label: "Temperature", unit: "°C", step: "0.1" },
  { key: "rr", label: "Resp. rate", unit: "/min" },
];

const wardOrder = [HOME_WARD, ...Array.from(new Set(allAdmitted.map((p) => p.ward!))).filter((w) => w !== HOME_WARD)];

/** Vitals entry with a live NEWS2 score, plus history for the chosen patient. */
export function VitalsScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = params.get("patient");
  const [patientId, setPatientId] = useState(() => (initial && getClinicalPatient(initial)?.ward ? initial : allAdmitted.find((p) => p.ward === HOME_WARD)!.id));
  const patient = getClinicalPatient(patientId)!;

  return (
    <div>
      <PageHeader
        eyebrow={`Sam Okafor · ${HOME_WARD}`}
        title="Vitals"
        description="Record a set of observations. The early warning score (NEWS) updates as you type."
      />

      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 shadow-soft sm:flex-row sm:items-center">
        <div className="space-y-1.5 sm:w-80">
          <Label htmlFor="vitals-patient">Patient</Label>
          <NativeSelect
            id="vitals-patient"
            value={patientId}
            onChange={(e) => {
              setPatientId(e.target.value);
              router.replace(`/dashboard/vitals?patient=${e.target.value}`, { scroll: false });
            }}
          >
            {wardOrder.map((w) => (
              <optgroup key={w} label={w}>
                {allAdmitted
                  .filter((p) => p.ward === w)
                  .sort((a, b) => Number(a.bed) - Number(b.bed))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      Bed {p.bed} · {p.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </NativeSelect>
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 sm:justify-end">
          <PatientIdentity patient={patient} size={40} sub={`${patient.ward}, bed ${patient.bed} · ${patient.condition}`} />
          <AllergyBadges allergies={patient.allergies} />
          <SafetyFlags patient={patient} compact />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <VitalsForm key={patient.id} patient={patient} />
        </div>
        <div className="xl:col-span-2">
          <History patient={patient} />
        </div>
      </div>
    </div>
  );
}

function VitalsForm({ patient }: { patient: Patient }) {
  const addVitals = useClinical((s) => s.addVitals);
  const detail = clinicalDetail(patient);
  const last = parseBp(patient.vitals.bp);
  const lastValues = { hr: patient.vitals.hr, sys: last.sys, dia: last.dia, spo2: patient.vitals.spo2, temp: patient.vitals.temp, rr: patient.vitals.rr };

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { avpu: "A", pain: detail.pain, onOxygen: false },
  });

  const v = watch();
  const ready = [v.hr, v.sys, v.spo2, v.temp, v.rr].every((n) => typeof n === "number" && Number.isFinite(n));
  const score = ready ? newsScore({ hr: v.hr, sys: v.sys, spo2: v.spo2, temp: v.temp, rr: v.rr, avpu: v.avpu, onOxygen: v.onOxygen }) : null;

  function onSubmit(values: Values) {
    const s = newsScore(values);
    addVitals({ ...values, patientId: patient.id, by: "Sam Okafor", news: s.score });
    toast.success("Vitals saved", { description: `${patient.name}: NEWS ${s.score} (${newsBandLabels[s.band]})` });
    if (s.score >= 5) toast.warning("NEWS 5 or more", { description: "Please escalate to the doctor now." });
    reset({ avpu: "A", pain: values.pain, onOxygen: values.onOxygen });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="rounded-2xl border border-border bg-surface shadow-soft">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-bold">New observation set</h2>
        <p className="text-xs text-muted-foreground">Last values are shown under each box.</p>
      </div>
      <div className="grid gap-6 p-5 lg:grid-cols-[1fr_240px]">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {fields.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label htmlFor={`v-${f.key}`}>
                  {f.label} <span className="font-normal text-muted-foreground">({f.unit})</span>
                </Label>
                <Input
                  id={`v-${f.key}`}
                  type="number"
                  inputMode="decimal"
                  step={f.step ?? "1"}
                  aria-invalid={!!errors[f.key]}
                  aria-describedby={`v-${f.key}-last`}
                  {...register(f.key, { valueAsNumber: true })}
                />
                <p id={`v-${f.key}-last`} className="text-[11px] text-muted-foreground">
                  Last: {lastValues[f.key]}
                </p>
                <FieldError message={errors[f.key]?.message} />
              </div>
            ))}
          </div>

          <fieldset>
            <legend className="text-sm font-semibold">Consciousness (ACVPU)</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {(Object.keys(avpuLabels) as Avpu[]).map((k) => (
                <label
                  key={k}
                  className="flex cursor-pointer flex-col rounded-xl border border-border px-3 py-2 text-xs has-[:checked]:border-primary has-[:checked]:bg-brand-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500 dark:has-[:checked]:bg-brand-950"
                >
                  <input type="radio" value={k} className="sr-only" {...register("avpu")} />
                  <span className="font-display text-base font-extrabold">{k}</span>
                  <span className="text-muted-foreground">{avpuLabels[k]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="v-pain">
                Pain score: <span className="tabular-nums">{Number.isFinite(v.pain) ? v.pain : 0}</span>/10
              </Label>
              <input id="v-pain" type="range" min={0} max={10} step={1} className="w-full accent-[var(--primary)]" {...register("pain", { valueAsNumber: true })} />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>No pain</span>
                <span>Worst</span>
              </div>
            </div>
            <label className="flex items-center gap-3 self-center rounded-xl border border-border px-3 py-2.5 text-sm">
              <input type="checkbox" className="size-4 accent-[var(--primary)]" {...register("onOxygen")} />
              On supplemental oxygen
            </label>
          </div>
        </div>

        <NewsPanel score={score} patient={patient} />
      </div>
      <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={() => reset({ avpu: "A", pain: detail.pain, onOxygen: false })}>
          Clear
        </Button>
        <Button type="submit">
          <Save aria-hidden /> Save vitals
        </Button>
      </div>
    </form>
  );
}

function NewsPanel({ score, patient }: { score: ReturnType<typeof newsScore> | null; patient: Patient }) {
  if (!score) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-5 text-center" aria-live="polite">
        <p className="font-display text-4xl font-extrabold text-muted-foreground">–</p>
        <p className="mt-1 text-sm font-semibold">NEWS score</p>
        <p className="mt-1 text-xs text-muted-foreground">Fill in HR, BP, SpO2, temp and RR to see the score.</p>
      </div>
    );
  }
  const st = bandStyles[score.band];
  const parts = [
    ["Resp. rate", score.parts.rr],
    ["SpO2", score.parts.spo2],
    ["Oxygen", score.parts.o2],
    ["Systolic BP", score.parts.sys],
    ["Pulse", score.parts.hr],
    ["Consciousness", score.parts.avpu],
    ["Temperature", score.parts.temp],
  ] as const;
  return (
    <div className={cn("rounded-2xl border-2 p-5", st.tile)} aria-live="polite">
      <p className="text-sm font-semibold">NEWS score</p>
      <p className={cn("font-display text-5xl font-extrabold tabular-nums", st.text)}>{score.score}</p>
      <NewsBadge score={score.score} band={score.band} showLabel className="mt-1" />
      <ul className="mt-4 space-y-1 text-xs">
        {parts.map(([l, n]) => (
          <li key={l} className="flex justify-between">
            <span className="text-muted-foreground">{l}</span>
            <span className={cn("font-bold tabular-nums", n === 3 && "text-red-700 dark:text-red-300")}>+{n}</span>
          </li>
        ))}
      </ul>
      {score.score >= 5 ? (
        <div className="mt-4 rounded-xl bg-red-600 p-3 text-white" role="alert">
          <p className="flex items-center gap-1.5 text-sm font-bold">
            <TriangleAlert className="size-4" aria-hidden /> Escalate to doctor
          </p>
          <p className="mt-1 text-xs text-red-50">
            {score.score >= 7 ? "Emergency response: call the doctor and outreach team now. Obs every 15–30 min." : "Urgent review within 1 hour. Obs at least every hour."}
          </p>
          <Button
            type="button"
            variant="white"
            size="sm"
            className="mt-3 w-full text-red-700"
            onClick={() => toast.success("Doctor paged", { description: `Dr. Haddad paged for ${patient.name}, bed ${patient.bed}.` })}
          >
            <BellRing aria-hidden /> Page doctor
          </Button>
        </div>
      ) : score.band === "low-medium" ? (
        <p className="mt-4 text-xs font-semibold text-amber-800 dark:text-amber-300">One value scores 3. Ask the nurse in charge to review.</p>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">Routine obs. Repeat in {score.score === 0 ? "12" : "4–6"} hours.</p>
      )}
    </div>
  );
}

function History({ patient }: { patient: Patient }) {
  const data = usePatientVitals(patient);
  const rows = useMemo(() => [...data].reverse().slice(0, 8), [data]);
  return (
    <div className="space-y-4">
      <MiniChart title="NEWS trend" unit="score" data={data} series={[{ key: "news", name: "NEWS", color: "#dc2626" }]} domain={[0, 12]} refLine={{ y: 5, label: "5" }} />
      <Panel
        title="Recent sets"
        action={
          <Button asChild variant="ghost" size="sm">
            <Link href={`/dashboard/patients/${patient.id}`}>
              <FileHeart aria-hidden /> Chart
            </Link>
          </Button>
        }
        bodyClassName="p-0"
      >
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-xs">
            <thead>
              <tr className="border-b border-border uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="px-4 py-2 font-bold">Time</th>
                <th scope="col" className="px-2 py-2 font-bold">HR</th>
                <th scope="col" className="px-2 py-2 font-bold">BP</th>
                <th scope="col" className="px-2 py-2 font-bold">SpO2</th>
                <th scope="col" className="px-2 py-2 font-bold">T</th>
                <th scope="col" className="px-2 py-2 font-bold">RR</th>
                <th scope="col" className="px-4 py-2 font-bold">NEWS</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {rows.map((r) => (
                <tr key={r.at + (r.recorded ? "r" : "")} className={cn("border-b border-border last:border-0", r.recorded && "bg-brand-50/60 dark:bg-brand-950/30")}>
                  <td className="whitespace-nowrap px-4 py-2">
                    {formatDay(r.at).split(",")[0]} {formatTime(r.at)}
                    {r.recorded && <span className="ml-1 font-semibold text-primary">· new</span>}
                  </td>
                  <td className="px-2 py-2">{r.hr}</td>
                  <td className="px-2 py-2">
                    {r.sys}/{r.dia}
                  </td>
                  <td className="px-2 py-2">{r.spo2}</td>
                  <td className="px-2 py-2">{r.temp}</td>
                  <td className="px-2 py-2">{r.rr}</td>
                  <td className="px-4 py-2">
                    <NewsBadge score={r.news} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
