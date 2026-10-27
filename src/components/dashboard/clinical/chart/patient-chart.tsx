"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Activity,
  ArrowLeft,
  CalendarClock,
  CircleCheck,
  ClipboardList,
  FileText,
  FlaskConical,
  HeartPulse,
  MessageCircle,
  NotebookPen,
  Pill,
  Plus,
  Signature,
  Stethoscope,
  Thermometer,
  Wind,
  Droplet,
  Gauge,
  BedDouble,
} from "lucide-react";
import { avpuLabels, clinicalDetail, getClinicalPatient, labResults, newsScore, parseBp, type TimelineEvent } from "@/data/clinical";
import { doctorsById } from "@/data/doctors";
import { insurersById } from "@/data/insurers";
import { useClinical } from "@/store/clinical";
import { useOrders } from "@/store/orders";
import { useSession } from "@/store/session";
import { daysFromNow, formatDay, formatTime, timeAgo } from "@/lib/dates";
import { cn, formatPrice } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Panel } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { AllergyBadges, NewsBadge, ResultFlagBadge, SafetyFlags, useLatestVitals } from "../shared";
import { NoteEditorDialog } from "../note-editor";
import { VitalsCharts } from "./vitals-charts";
import { OrderTestDialog } from "./order-test-dialog";

/** Patient chart shared by doctors and nurses: header, summary, vitals, notes, results, orders and timeline. */
export function PatientChart({ id }: { id: string }) {
  const patient = getClinicalPatient(id);
  const role = useSession((s) => s.role);
  const latest = useLatestVitals();

  if (!patient) {
    return (
      <EmptyState
        image="/images/dashboard/empty-records.png"
        title="Patient not found"
        description="We could not find a chart for this patient. Check the link or go back to the list."
        action={
          <Button asChild variant="soft">
            <Link href={role === "nurse" ? "/dashboard/ward" : "/dashboard/patients"}>Back to patients</Link>
          </Button>
        }
      />
    );
  }

  const detail = clinicalDetail(patient);
  const doctor = doctorsById[patient.doctorId];
  const insurer = patient.insurerId ? insurersById[patient.insurerId] : undefined;
  const lv = latest[patient.id];
  const news = lv?.news ?? patient.news;

  return (
    <div className="space-y-6">
      <Link
        href={role === "nurse" ? "/dashboard/ward" : "/dashboard/patients"}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden /> {role === "nurse" ? "Ward board" : "My patients"}
      </Link>

      <section className="rounded-3xl border border-border bg-surface p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <Avatar name={patient.name} src={patient.avatar} size={72} className="ring-4 ring-brand-50 dark:ring-brand-950" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold">{patient.name}</h1>
                <StatusBadge status={patient.status} />
                {patient.ward && <NewsBadge score={news} showLabel />}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="font-mono">{patient.mrn}</span> · {patient.age} years · {patient.sex === "F" ? "Female" : "Male"} · Blood type{" "}
                <span className="font-semibold text-foreground">{patient.bloodType}</span>
              </p>
              <p className="mt-1 text-sm font-medium">{patient.condition}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Allergies:</span>
                <AllergyBadges allergies={patient.allergies} />
              </div>
              <SafetyFlags patient={patient} detail={detail} compact className="mt-2" />
            </div>
          </div>
          <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-3 rounded-2xl bg-surface-2 p-4 text-sm sm:grid-cols-4 lg:w-[420px] lg:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Ward / bed</dt>
              <dd className="font-semibold">{patient.ward ? `${patient.ward}, bed ${patient.bed}` : "Outpatient"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Attending</dt>
              <dd className="font-semibold">{doctor?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Admitted</dt>
              <dd className="font-semibold">{patient.admittedAt ?? "Not admitted"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Insurance</dt>
              <dd className="font-semibold">{insurer?.name ?? "Self-pay"}</dd>
            </div>
          </dl>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
          {role === "nurse" ? (
            <Button asChild size="sm">
              <Link href={`/dashboard/vitals?patient=${patient.id}`}>
                <Activity aria-hidden /> Record vitals
              </Link>
            </Button>
          ) : (
            <OrderTestDialog patient={patient} />
          )}
          <Button asChild size="sm" variant="outline">
            <Link href={role === "nurse" ? "/dashboard/staff-chat" : "/dashboard/messages"}>
              <MessageCircle aria-hidden /> {role === "nurse" ? "Message the team" : "Message patient"}
            </Link>
          </Button>
          {role === "nurse" && patient.ward && (
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/rounds">
                <Pill aria-hidden /> Medication round
              </Link>
            </Button>
          )}
        </div>
      </section>

      <Tabs defaultValue="summary">
        <TabsList aria-label="Chart sections">
          <TabsTrigger value="summary">
            <ClipboardList aria-hidden /> Summary
          </TabsTrigger>
          <TabsTrigger value="vitals">
            <HeartPulse aria-hidden /> Vitals
          </TabsTrigger>
          <TabsTrigger value="notes">
            <NotebookPen aria-hidden /> Notes
          </TabsTrigger>
          <TabsTrigger value="results">
            <FlaskConical aria-hidden /> Results
          </TabsTrigger>
          <TabsTrigger value="orders">
            <FileText aria-hidden /> Orders
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <CalendarClock aria-hidden /> Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <SummaryTab patientId={patient.id} />
        </TabsContent>
        <TabsContent value="vitals">
          <VitalsCharts patient={patient} />
        </TabsContent>
        <TabsContent value="notes">
          <NotesTab patientId={patient.id} />
        </TabsContent>
        <TabsContent value="results">
          <ResultsTab patientId={patient.id} />
        </TabsContent>
        <TabsContent value="orders">
          <OrdersTab patientId={patient.id} />
        </TabsContent>
        <TabsContent value="timeline">
          <TimelineTab patientId={patient.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------- Summary ---------- */

function VitalTile({ icon: I, label, value, unit, alert }: { icon: typeof HeartPulse; label: string; value: React.ReactNode; unit?: string; alert?: boolean }) {
  return (
    <div className={cn("rounded-2xl border p-3", alert ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/50" : "border-border bg-surface")}>
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <I className={cn("size-3.5", alert && "text-red-600")} aria-hidden /> {label}
        {alert && <span className="ml-auto rounded bg-red-600 px-1 text-[10px] font-bold text-white">OUT OF RANGE</span>}
      </p>
      <p className={cn("mt-1 font-display text-xl font-extrabold tabular-nums", alert && "text-red-700 dark:text-red-300")}>
        {value} {unit && <span className="text-xs font-normal text-muted-foreground">{unit}</span>}
      </p>
    </div>
  );
}

function SummaryTab({ patientId }: { patientId: string }) {
  const patient = getClinicalPatient(patientId)!;
  const detail = clinicalDetail(patient);
  const latest = useLatestVitals()[patientId];
  const bp = parseBp(patient.vitals.bp);
  const v = latest ?? { hr: patient.vitals.hr, sys: bp.sys, dia: bp.dia, spo2: patient.vitals.spo2, temp: patient.vitals.temp, rr: patient.vitals.rr, avpu: detail.avpu, pain: detail.pain };
  const parts = newsScore(v).parts;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Panel title="Recent vitals" description={latest ? `Recorded ${timeAgo(latest.at)} by ${latest.by}` : "Latest set on the chart"} className="lg:col-span-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <VitalTile icon={HeartPulse} label="Heart rate" value={v.hr} unit="bpm" alert={parts.hr >= 2} />
          <VitalTile icon={Gauge} label="Blood pressure" value={`${v.sys}/${v.dia}`} unit="mmHg" alert={parts.sys >= 2} />
          <VitalTile icon={Droplet} label="SpO2" value={v.spo2} unit="%" alert={parts.spo2 >= 2} />
          <VitalTile icon={Thermometer} label="Temperature" value={v.temp} unit="°C" alert={parts.temp >= 2} />
          <VitalTile icon={Wind} label="Resp. rate" value={v.rr} unit="/min" alert={parts.rr >= 2} />
          <VitalTile icon={Activity} label="Consciousness" value={avpuLabels[v.avpu].split(" ")[0]} alert={v.avpu !== "A"} />
        </div>
      </Panel>
      <Panel title="Problem list" description={`${detail.problems.length} active`}>
        <ul className="space-y-2 text-sm">
          {detail.problems.map((p, i) => (
            <li key={p} className="flex gap-2">
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", i === 0 ? "bg-coral-500" : "bg-brand-500")} aria-hidden />
              {p}
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Current medicines" description={detail.meds.length ? `${detail.meds.length} regular` : "None on record"} className="lg:col-span-2" bodyClassName="p-0">
        {detail.meds.length ? (
          <div className="relative overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th scope="col" className="px-5 py-2.5 font-bold">Medicine</th>
                  <th scope="col" className="px-3 py-2.5 font-bold">Dose</th>
                  <th scope="col" className="px-3 py-2.5 font-bold">Route</th>
                  <th scope="col" className="px-5 py-2.5 font-bold">Times</th>
                </tr>
              </thead>
              <tbody>
                {detail.meds.map((m) => (
                  <tr key={m.name} className="border-b border-border last:border-0">
                    <td className="px-5 py-2.5 font-semibold">{m.name}</td>
                    <td className="px-3 py-2.5 tabular-nums">{m.dose}</td>
                    <td className="px-3 py-2.5">
                      <Badge variant="outline">{m.route}</Badge>
                    </td>
                    <td className="px-5 py-2.5 tabular-nums text-muted-foreground">{m.times.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-5 text-sm text-muted-foreground">No regular medicines.</p>
        )}
      </Panel>
    </div>
  );
}

/* ---------- Notes ---------- */

function NotesTab({ patientId }: { patientId: string }) {
  const all = useClinical((s) => s.notes);
  const signNote = useClinical((s) => s.signNote);
  const role = useSession((s) => s.role);
  const notes = useMemo(() => all.filter((n) => n.patientId === patientId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [all, patientId]);
  const [editor, setEditor] = useState<{ noteId?: string } | null>(null);

  return (
    <Panel
      title="Visit notes"
      description={`${notes.length} note(s) · ${notes.filter((n) => n.status === "draft").length} draft`}
      action={
        role === "doctor" && (
          <Button size="sm" onClick={() => setEditor({})}>
            <Plus aria-hidden /> New note
          </Button>
        )
      }
      bodyClassName="p-0"
    >
      {notes.length === 0 ? (
        <EmptyState compact image="/images/dashboard/empty-records.png" title="No notes yet" description="Notes written for this patient will show here." />
      ) : (
        <ul className="divide-y divide-border">
          {notes.map((n) => (
            <li key={n.id} className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Stethoscope className="size-4 text-primary" aria-hidden />
                <h3 className="font-bold">{n.type}</h3>
                <StatusBadge status={n.status === "signed" ? "completed" : "draft"} label={n.status === "signed" ? "Signed" : "Draft"} />
                <span className="text-xs text-muted-foreground">
                  {formatDay(n.createdAt)}, {formatTime(n.createdAt)} · {n.authorName}
                </span>
                {n.status === "draft" && role === "doctor" && (
                  <span className="ml-auto flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditor({ noteId: n.id })}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        signNote(n.id);
                        toast.success("Note signed");
                      }}
                    >
                      <Signature aria-hidden /> Sign
                    </Button>
                  </span>
                )}
              </div>
              <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                {(
                  [
                    ["S", "Subjective", n.subjective],
                    ["O", "Objective", n.objective],
                    ["A", "Assessment", n.assessment],
                    ["P", "Plan", n.plan],
                  ] as const
                ).map(([l, label, text]) => (
                  <div key={l} className="rounded-xl bg-surface-2 p-3">
                    <dt className="text-xs font-bold text-muted-foreground">
                      <span aria-hidden>{l} · </span>
                      {label}
                    </dt>
                    <dd className="mt-1 whitespace-pre-line">{text || <span className="text-muted-foreground">Not written yet</span>}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      )}
      <NoteEditorDialog open={!!editor} onOpenChange={(o) => !o && setEditor(null)} noteId={editor?.noteId} patientId={patientId} />
    </Panel>
  );
}

/* ---------- Results ---------- */

function ResultsTab({ patientId }: { patientId: string }) {
  const reviewed = useClinical((s) => s.reviewed);
  const markReviewed = useClinical((s) => s.markReviewed);
  const role = useSession((s) => s.role);
  const results = labResults.filter((r) => r.patientId === patientId).sort((a, b) => a.hoursAgo - b.hoursAgo);

  if (!results.length) {
    return <EmptyState image="/images/dashboard/empty-records.png" title="No results" description="No lab or imaging results on file." />;
  }
  return (
    <div className="relative overflow-x-auto rounded-2xl border border-border bg-surface shadow-soft">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            <th scope="col" className="px-5 py-3 font-bold">Test</th>
            <th scope="col" className="px-3 py-3 font-bold">Flag</th>
            <th scope="col" className="px-3 py-3 font-bold">Result</th>
            <th scope="col" className="px-3 py-3 font-bold">Range</th>
            <th scope="col" className="px-3 py-3 font-bold">When</th>
            <th scope="col" className="px-5 py-3 font-bold">Review</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => {
            const done = r.reviewed || !!reviewed[r.id];
            return (
              <tr key={r.id} className={cn("border-b border-border last:border-0", r.flag === "critical" && "bg-red-50/60 dark:bg-red-950/30")}>
                <td className="px-5 py-3 font-semibold">
                  {r.name}
                  <span className="block text-xs font-normal text-muted-foreground">{r.kind === "imaging" ? "Imaging / ECG" : "Lab"}</span>
                </td>
                <td className="px-3 py-3">
                  <ResultFlagBadge flag={r.flag} />
                </td>
                <td className={cn("px-3 py-3 tabular-nums", r.flag !== "normal" && "font-bold", r.flag === "critical" && "text-red-700 dark:text-red-300")}>
                  {r.kind === "lab" ? `${r.value} ${r.unit}` : <span className="block max-w-xs font-normal">{r.report}</span>}
                </td>
                <td className="px-3 py-3 tabular-nums text-muted-foreground">{r.kind === "lab" ? `${r.low}–${r.high}` : "—"}</td>
                <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">{r.hoursAgo < 24 ? `${r.hoursAgo} h ago` : `${Math.round(r.hoursAgo / 24)} d ago`}</td>
                <td className="px-5 py-3">
                  {done ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-300">
                      <CircleCheck className="size-3.5" aria-hidden /> Reviewed
                    </span>
                  ) : role === "doctor" ? (
                    <Button
                      size="sm"
                      variant="soft"
                      onClick={() => {
                        markReviewed(r.id);
                        toast.success("Marked as reviewed", { description: r.name });
                      }}
                    >
                      Mark reviewed
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Awaiting doctor</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Orders ---------- */

function OrdersTab({ patientId }: { patientId: string }) {
  const all = useOrders((s) => s.orders);
  const role = useSession((s) => s.role);
  const patient = getClinicalPatient(patientId)!;
  const orders = useMemo(() => all.filter((o) => o.patientId === patientId), [all, patientId]);

  return (
    <Panel
      title="Orders"
      description="Tests, medicines and products ordered for this patient"
      action={role === "doctor" && <OrderTestDialog patient={patient} />}
      bodyClassName="p-0"
    >
      {orders.length === 0 ? (
        <EmptyState compact image="/images/dashboard/empty-orders.png" title="No orders" description="Nothing ordered for this patient yet." />
      ) : (
        <ul className="divide-y divide-border">
          {orders.map((o) => (
            <li key={o.id} className="flex flex-wrap items-start gap-3 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{o.lines.map((l) => l.name).join(", ")}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  <span className="font-mono">{o.id}</span> · {formatDay(o.createdAt)} · {formatPrice(o.subtotal)}
                  {o.slot && ` · ${o.slot}`}
                </p>
                {o.lab?.resultNote && <p className="mt-1 text-xs">{o.lab.resultNote}</p>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {o.lab && <StatusBadge status={o.lab.status} label={`Lab: ${o.lab.status}`} />}
                {o.rx && <StatusBadge status={o.rx.status} label={`Rx ${o.rx.status}`} />}
                <StatusBadge status={o.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/* ---------- Timeline ---------- */

const kindIcon: Record<TimelineEvent["kind"], typeof BedDouble> = {
  admission: BedDouble,
  test: FlaskConical,
  procedure: HeartPulse,
  medication: Pill,
  visit: Stethoscope,
  note: NotebookPen,
};

function TimelineTab({ patientId }: { patientId: string }) {
  const patient = getClinicalPatient(patientId)!;
  const notes = useClinical((s) => s.notes);
  const vitals = useClinical((s) => s.vitals);
  const events = useMemo(() => {
    const base = clinicalDetail(patient).timeline.map((e) => ({ at: daysFromNow(e.days, e.time), title: e.title, detail: e.detail, kind: e.kind }));
    const extra = [
      ...notes
        .filter((n) => n.patientId === patientId && n.status === "signed" && n.signedAt)
        .map((n) => ({ at: n.signedAt!, title: `${n.type} note signed`, detail: n.assessment, kind: "note" as const })),
      ...vitals
        .filter((v) => v.patientId === patientId)
        .map((v) => ({ at: v.at, title: `Vitals recorded, NEWS ${v.news}`, detail: `HR ${v.hr}, BP ${v.sys}/${v.dia}, SpO2 ${v.spo2}% · by ${v.by}`, kind: "test" as const })),
    ];
    return [...base, ...extra].sort((a, b) => b.at.localeCompare(a.at));
  }, [patient, patientId, notes, vitals]);

  return (
    <Panel title="Timeline" description="Admission, tests, procedures and notes, newest first">
      <ol className="relative space-y-5 border-l-2 border-border pl-6">
        {events.map((e, i) => {
          const I = kindIcon[e.kind];
          const future = new Date(e.at).getTime() > Date.now();
          return (
            <li key={`${e.at}-${i}`} className="relative">
              <span className="absolute -left-[37px] grid size-7 place-items-center rounded-full border-2 border-surface bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200">
                <I className="size-3.5" aria-hidden />
              </span>
              <p className="text-xs font-semibold text-muted-foreground">
                {formatDay(e.at)}, {formatTime(e.at)} {future && <Badge variant="blue">Upcoming</Badge>}
              </p>
              <p className="font-semibold">{e.title}</p>
              <p className="text-sm text-muted-foreground">{e.detail}</p>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}
