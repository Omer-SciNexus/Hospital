"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { ArrowRight, ClipboardCheck, Printer, Save, Signature } from "lucide-react";
import { site } from "@/config/site";
import { clinicalDetail, HOME_WARD, NURSE_ID, wardPatients, type Sbar } from "@/data/clinical";
import type { Patient } from "@/data/patients";
import { staff, staffById } from "@/data/staff";
import { useClinical } from "@/store/clinical";
import { formatDay, formatTime } from "@/lib/dates";
import { useHydrated } from "@/lib/use-hydrated";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Label, NativeSelect, Textarea } from "@/components/ui/form-controls";
import { PageHeader, Panel } from "@/components/dashboard/page-header";
import { AllergyBadges, NewsBadge, PatientIdentity, SafetyFlags, useNewsOf } from "../shared";

const parts: { key: keyof Sbar; letter: string; label: string }[] = [
  { key: "situation", letter: "S", label: "Situation" },
  { key: "background", letter: "B", label: "Background" },
  { key: "assessment", letter: "A", label: "Assessment" },
  { key: "recommendation", letter: "R", label: "Recommendation" },
];

const nurses = staff.filter((s) => s.role === "nurse");

/** SBAR shift handover for the ward, with sign-off and a print view. */
export function HandoverScreen() {
  const patients = wardPatients(HOME_WARD);
  const edits = useClinical((s) => s.sbar);
  const handovers = useClinical((s) => s.handovers);
  const signHandover = useClinical((s) => s.signHandover);
  const hydrated = useHydrated();
  const [from, setFrom] = useState(NURSE_ID);
  const [to, setTo] = useState("tom-baker");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [faceToFace, setFaceToFace] = useState(false);

  const sbarOf = (p: Patient) => edits[p.id] ?? clinicalDetail(p).sbar!;
  const fromName = staffById[from]?.name ?? "";
  const toName = staffById[to]?.name ?? "";

  function signOff() {
    signHandover({ ward: HOME_WARD, from: fromName, to: toName, patientIds: patients.map((p) => p.id) });
    toast.success("Handover signed off", { description: `${fromName} handed ${patients.length} patients to ${toName}.` });
    setConfirmOpen(false);
    setFaceToFace(false);
  }

  return (
    <div>
      <PageHeader
        eyebrow={`${HOME_WARD} · Day to night shift`}
        title="Handover"
        description="SBAR for every patient. Edit what changed this shift, then sign off with the incoming nurse."
        actions={
          <>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer aria-hidden /> Print
            </Button>
            <Button onClick={() => setConfirmOpen(true)} disabled={from === to}>
              <Signature aria-hidden /> Sign off handover
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 rounded-2xl border border-border bg-surface p-4 shadow-soft sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="ho-from">Outgoing nurse</Label>
          <NativeSelect id="ho-from" value={from} onChange={(e) => setFrom(e.target.value)}>
            {nurses.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name} · {n.title}
              </option>
            ))}
          </NativeSelect>
        </div>
        <ArrowRight className="hidden size-5 self-center text-muted-foreground sm:mb-3 sm:block" aria-hidden />
        <div className="space-y-1.5">
          <Label htmlFor="ho-to">Incoming nurse</Label>
          <NativeSelect id="ho-to" value={to} onChange={(e) => setTo(e.target.value)} aria-invalid={from === to}>
            {nurses.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name} · {n.shift} shift
              </option>
            ))}
          </NativeSelect>
          {from === to && <p className="text-xs font-medium text-red-600 dark:text-red-400">Pick a different nurse to hand over to.</p>}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <ul className="space-y-4">
          {patients.map((p) => (
            <li key={p.id}>
              <SbarCard patient={p} initial={sbarOf(p)} edited={!!edits[p.id]} />
            </li>
          ))}
        </ul>

        <aside className="space-y-4">
          <Panel title="Sign-off history" description="Most recent first" bodyClassName="p-3">
            {handovers.length === 0 ? (
              <p className="p-2 text-sm text-muted-foreground">No handovers signed yet on this device.</p>
            ) : (
              <ul className="space-y-2">
                {handovers.slice(0, 6).map((h) => (
                  <li key={h.id} className="rounded-xl bg-surface-2 p-3 text-sm">
                    <p className="flex items-center gap-1.5 font-semibold">
                      <ClipboardCheck className="size-4 text-green-600" aria-hidden />
                      {h.from} → {h.to}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDay(h.signedAt)}, {formatTime(h.signedAt)} · {h.patientIds.length} patients
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="SBAR tips" bodyClassName="text-sm text-muted-foreground space-y-1.5">
            <p>
              <b className="text-foreground">S</b>ituation: what is happening now.
            </p>
            <p>
              <b className="text-foreground">B</b>ackground: history that matters.
            </p>
            <p>
              <b className="text-foreground">A</b>ssessment: what you found this shift.
            </p>
            <p>
              <b className="text-foreground">R</b>ecommendation: what the next nurse must do.
            </p>
          </Panel>
        </aside>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent size="sm">
          <DialogTitle>Sign off handover?</DialogTitle>
          <DialogDescription>
            {fromName} hands {patients.length} patients on {HOME_WARD} to {toName}.
          </DialogDescription>
          <label htmlFor="ho-confirm" className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 text-sm">
            <Checkbox id="ho-confirm" checked={faceToFace} onCheckedChange={(v) => setFaceToFace(v === true)} className="mt-0.5" />
            We went through every patient together, including allergies, NEWS alerts and medicines due.
          </label>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={signOff} disabled={!faceToFace}>
              <Signature aria-hidden /> Sign off
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {hydrated &&
        createPortal(
          <PrintView patients={patients} sbarOf={sbarOf} fromName={fromName} toName={toName} />,
          document.body,
        )}
    </div>
  );
}

function SbarCard({ patient: p, initial, edited }: { patient: Patient; initial: Sbar; edited: boolean }) {
  const setSbar = useClinical((s) => s.setSbar);
  const newsOf = useNewsOf();
  const [draft, setDraft] = useState<Sbar>(initial);
  const dirty = parts.some((x) => draft[x.key] !== initial[x.key]);

  return (
    <article className="rounded-2xl border border-border bg-surface shadow-soft" aria-labelledby={`sbar-${p.id}`}>
      <header className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3">
        <span className="font-display text-lg font-extrabold tabular-nums">Bed {p.bed}</span>
        <span id={`sbar-${p.id}`} className="min-w-0 flex-1">
          <PatientIdentity patient={p} size={32} sub={p.condition} />
        </span>
        <NewsBadge score={newsOf(p)} />
        {edited && !dirty && <span className="text-xs font-semibold text-green-700 dark:text-green-300">Updated</span>}
      </header>
      <div className="flex flex-wrap gap-2 px-5 pt-3">
        <AllergyBadges allergies={p.allergies} />
        <SafetyFlags patient={p} compact />
      </div>
      <div className="grid gap-3 p-5 md:grid-cols-2">
        {parts.map((x) => (
          <div key={x.key} className="space-y-1">
            <Label htmlFor={`sbar-${p.id}-${x.key}`} className="flex items-center gap-2 text-xs">
              <span className="grid size-5 place-items-center rounded bg-brand-50 text-[11px] font-extrabold text-brand-800 dark:bg-brand-950 dark:text-brand-200" aria-hidden>
                {x.letter}
              </span>
              {x.label}
            </Label>
            <Textarea
              id={`sbar-${p.id}-${x.key}`}
              className="min-h-24 text-sm"
              value={draft[x.key]}
              onChange={(e) => setDraft((d) => ({ ...d, [x.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      {dirty && (
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <Button size="sm" variant="ghost" onClick={() => setDraft(initial)}>
            Undo
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setSbar(p.id, draft);
              toast.success("SBAR saved", { description: `Bed ${p.bed}, ${p.name}` });
            }}
          >
            <Save aria-hidden /> Save
          </Button>
        </div>
      )}
    </article>
  );
}

/** Plain print layout. It sits outside the app shell and only shows when printing. */
function PrintView({ patients, sbarOf, fromName, toName }: { patients: Patient[]; sbarOf: (p: Patient) => Sbar; fromName: string; toName: string }) {
  const now = new Date().toISOString();
  return (
    <div id="handover-print" className="hidden bg-white p-8 text-black">
      <style>{`@media print {
        body > *:not(#handover-print) { display: none !important; }
        #handover-print { display: block !important; }
        #handover-print article { break-inside: avoid; }
        @page { margin: 14mm; }
      }`}</style>
      <h1 className="text-xl font-bold">
        {site.name} · {HOME_WARD} handover
      </h1>
      <p className="mt-1 text-sm">
        {formatDay(now)}, {formatTime(now)} · {fromName} to {toName} · {patients.length} patients
      </p>
      {patients.map((p) => {
        const s = sbarOf(p);
        return (
          <article key={p.id} className="mt-4 border-t border-black/30 pt-3 text-[12px] leading-snug">
            <p className="text-sm font-bold">
              Bed {p.bed} · {p.name}, {p.age}
              {p.sex} · {p.mrn} · NEWS {p.news}
              {p.allergies.length > 0 && ` · ALLERGY: ${p.allergies.join(", ").toUpperCase()}`}
            </p>
            <p className="italic">{p.condition}</p>
            {parts.map((x) => (
              <p key={x.key} className="mt-1">
                <b>{x.label}:</b> {s[x.key]}
              </p>
            ))}
          </article>
        );
      })}
      <p className="mt-8 text-sm">Outgoing signature: ____________________ Incoming signature: ____________________</p>
    </div>
  );
}
