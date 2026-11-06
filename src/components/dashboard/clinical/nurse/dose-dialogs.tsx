"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Hand, Syringe } from "lucide-react";
import { useClinical } from "@/store/clinical";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Label, NativeSelect, Textarea } from "@/components/ui/form-controls";
import { AllergyBadges, PatientIdentity } from "../shared";
import type { Dose } from "./use-doses";

const NURSE = "Sam Okafor";

/** Confirm a dose with the five rights checklist (patient, drug, dose, route, time). */
export function GiveDoseDialog({ dose, onClose }: { dose: Dose | null; onClose: () => void }) {
  return (
    <Dialog open={!!dose} onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="md">{dose && <GiveForm key={dose.key} dose={dose} onClose={onClose} />}</DialogContent>
    </Dialog>
  );
}

function GiveForm({ dose, onClose }: { dose: Dose; onClose: () => void }) {
  const setDose = useClinical((s) => s.setDose);
  const p = dose.patient;
  const rights = [
    { id: "patient", label: "Right patient", detail: `${p.name}, ${p.mrn}, wristband checked` },
    { id: "drug", label: "Right drug", detail: `${dose.med.name}, allergies checked` },
    { id: "dose", label: "Right dose", detail: dose.med.dose },
    { id: "route", label: "Right route", detail: { PO: "By mouth (PO)", IV: "Into a vein (IV)", SC: "Under the skin (SC)", Inh: "Inhaled" }[dose.med.route] },
    { id: "time", label: "Right time", detail: `Due ${dose.round}${dose.overdue ? " (late)" : ""}` },
  ];
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const all = rights.every((r) => checked[r.id]);

  function give() {
    const at = new Date();
    setDose(dose.key, { status: "given", at: at.toISOString(), by: NURSE });
    toast.success(`${dose.med.name} ${dose.med.dose} given`, {
      description: `${p.name}, bed ${p.bed}, at ${at.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`,
    });
    onClose();
  }

  return (
    <>
      <DialogTitle className="flex items-center gap-2">
        <Syringe className="size-5 text-primary" aria-hidden /> Give medicine
      </DialogTitle>
      <DialogDescription>Tick each of the five rights before you confirm.</DialogDescription>
      <div className="mt-5 rounded-2xl bg-surface-2 p-4">
        <PatientIdentity patient={p} size={40} sub={`Bed ${p.bed} · ${p.mrn}`} />
        <p className="mt-3 font-display text-lg font-extrabold">
          {dose.med.name} {dose.med.dose} <span className="text-sm font-semibold text-muted-foreground">{dose.med.route} · {dose.round}</span>
        </p>
        <AllergyBadges allergies={p.allergies} className="mt-2" />
      </div>
      <fieldset className="mt-5 space-y-2">
        <legend className="mb-2 text-sm font-bold">Five rights</legend>
        {rights.map((r) => (
          <label
            key={r.id}
            htmlFor={`right-${r.id}`}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-2.5 has-[[data-state=checked]]:border-green-400 has-[[data-state=checked]]:bg-green-50 dark:has-[[data-state=checked]]:bg-green-950/40"
          >
            <Checkbox id={`right-${r.id}`} checked={!!checked[r.id]} onCheckedChange={(v) => setChecked((c) => ({ ...c, [r.id]: v === true }))} />
            <span className="text-sm">
              <span className="font-semibold">{r.label}</span>
              <span className="block text-xs text-muted-foreground">{r.detail}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <DialogFooter className="items-center">
        <button
          type="button"
          className="text-sm font-semibold text-primary hover:underline sm:mr-auto"
          onClick={() => setChecked(Object.fromEntries(rights.map((r) => [r.id, true])))}
        >
          Tick all
        </button>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={give} disabled={!all}>
          <Syringe aria-hidden /> Confirm given
        </Button>
      </DialogFooter>
    </>
  );
}

const holdReasons = ["Patient refused", "Patient nil by mouth", "Vital signs outside safe range", "Patient off the ward", "Medicine not available", "Doctor asked to hold"];

/** Hold a dose with a reason. */
export function HoldDoseDialog({ dose, onClose }: { dose: Dose | null; onClose: () => void }) {
  const setDose = useClinical((s) => s.setDose);
  const [reason, setReason] = useState(holdReasons[0]);
  const [note, setNote] = useState("");

  function hold(e: React.FormEvent) {
    e.preventDefault();
    if (!dose) return;
    setDose(dose.key, { status: "held", at: new Date().toISOString(), by: NURSE, reason: note ? `${reason}. ${note}` : reason });
    toast(`${dose.med.name} held`, { description: `${dose.patient.name}: ${reason}` });
    setNote("");
    onClose();
  }

  return (
    <Dialog open={!!dose} onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="sm">
        {dose && (
          <form onSubmit={hold}>
            <DialogTitle className="flex items-center gap-2">
              <Hand className="size-5 text-coral-600" aria-hidden /> Hold dose
            </DialogTitle>
            <DialogDescription>
              {dose.med.name} {dose.med.dose} {dose.med.route} for {dose.patient.name}, bed {dose.patient.bed}
            </DialogDescription>
            <div className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="hold-reason">Reason</Label>
                <NativeSelect id="hold-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
                  {holdReasons.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hold-note">
                  Note <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Textarea id="hold-note" className="min-h-20" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="e.g. BP 92/58, doctor told" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="accent">
                <Hand aria-hidden /> Hold dose
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
