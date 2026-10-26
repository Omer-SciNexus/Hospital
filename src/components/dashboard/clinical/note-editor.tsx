"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Activity, PenLine, Save, Signature } from "lucide-react";
import { doctorPatients, getClinicalPatient } from "@/data/clinical";
import { useClinical, type VisitNote } from "@/store/clinical";
import { useSession } from "@/store/session";
import { roles } from "@/config/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { FieldError, Label, NativeSelect, Textarea } from "@/components/ui/form-controls";
import { AllergyBadges, NewsBadge, useLatestVitals } from "./shared";

const noteTypes = ["Clinic visit", "Video visit", "Ward round", "Procedure"] as const;

const schema = z.object({
  patientId: z.string().min(1, "Choose a patient"),
  type: z.enum(noteTypes),
  subjective: z.string().trim().min(3, "Write what the patient tells you"),
  objective: z.string().trim().min(3, "Add exam findings or vitals"),
  assessment: z.string().trim().min(3, "Add your assessment"),
  plan: z.string().trim().min(3, "Add the plan"),
});

type Values = z.infer<typeof schema>;

const sections: { key: "subjective" | "objective" | "assessment" | "plan"; letter: string; label: string; hint: string }[] = [
  { key: "subjective", letter: "S", label: "Subjective", hint: "Symptoms and history in the patient's words" },
  { key: "objective", letter: "O", label: "Objective", hint: "Vitals, exam and test results" },
  { key: "assessment", letter: "A", label: "Assessment", hint: "Your working diagnosis" },
  { key: "plan", letter: "P", label: "Plan", hint: "Treatment, tests, follow-up" },
];

/**
 * SOAP visit note editor in a dialog. Pass `noteId` to edit a draft, or
 * `patientId` to start a new note for that patient. Saves to the clinical store.
 */
export function NoteEditorDialog({
  open,
  onOpenChange,
  noteId,
  patientId,
  type,
  onSigned,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteId?: string;
  patientId?: string;
  type?: VisitNote["type"];
  onSigned?: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        {open && (
          <NoteForm
            key={`${noteId ?? "new"}-${patientId ?? ""}`}
            noteId={noteId}
            patientId={patientId}
            type={type}
            onDone={(signed) => {
              onOpenChange(false);
              if (signed) onSigned?.();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function NoteForm({ noteId, patientId, type, onDone }: { noteId?: string; patientId?: string; type?: VisitNote["type"]; onDone: (signed: boolean) => void }) {
  const notes = useClinical((s) => s.notes);
  const saveNote = useClinical((s) => s.saveNote);
  const role = useSession((s) => s.role);
  const profile = useSession((s) => s.profile);
  const author = profile?.name || roles.find((r) => r.id === role)?.person || "Dr. Layla Haddad";
  const latest = useLatestVitals();
  const existing = noteId ? notes.find((n) => n.id === noteId) : undefined;

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      patientId: existing?.patientId ?? patientId ?? "",
      type: existing?.type ?? type ?? "Clinic visit",
      subjective: existing?.subjective ?? "",
      objective: existing?.objective ?? "",
      assessment: existing?.assessment ?? "",
      plan: existing?.plan ?? "",
    },
  });

  const pid = watch("patientId");
  const patient = pid ? getClinicalPatient(pid) : undefined;
  const fixedPatient = !!(existing || patientId);

  function vitalsLine() {
    if (!patient) return "";
    const v = latest[patient.id];
    if (v) return `HR ${v.hr}, BP ${v.sys}/${v.dia}, SpO2 ${v.spo2}%, temp ${v.temp} °C, RR ${v.rr}. NEWS ${v.news}.`;
    const p = patient.vitals;
    return `HR ${p.hr}, BP ${p.bp}, SpO2 ${p.spo2}%, temp ${p.temp} °C, RR ${p.rr}. NEWS ${patient.news}.`;
  }

  function persist(values: Values, sign: boolean) {
    saveNote({ ...values, id: existing?.id, authorName: author }, sign);
    toast.success(sign ? "Note signed" : "Draft saved", { description: patient ? `${values.type} for ${patient.name}` : undefined });
    onDone(sign);
  }

  function saveDraft() {
    const values = getValues();
    if (!values.patientId) {
      setError("patientId", { message: "Choose a patient" });
      return;
    }
    persist(values, false);
  }

  return (
    <form onSubmit={handleSubmit((v) => persist(v, true))} noValidate>
      <DialogTitle className="flex items-center gap-2">
        <PenLine className="size-5 text-primary" aria-hidden />
        {existing ? "Edit visit note" : "New visit note"}
      </DialogTitle>
      <DialogDescription>Write in SOAP format. Save a draft at any time; sign when all four parts are done.</DialogDescription>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="note-patient">Patient</Label>
          {fixedPatient ? (
            <>
              <input type="hidden" {...register("patientId")} />
              <p id="note-patient" className="flex h-11 items-center rounded-xl border border-border bg-surface-2 px-4 text-sm font-semibold">
                {patient ? `${patient.name} · ${patient.mrn}` : "Unknown patient"}
              </p>
            </>
          ) : (
            <NativeSelect id="note-patient" aria-invalid={!!errors.patientId} {...register("patientId")}>
              <option value="" disabled>
                Choose a patient
              </option>
              {doctorPatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.mrn}
                </option>
              ))}
            </NativeSelect>
          )}
          <FieldError message={errors.patientId?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="note-type">Visit type</Label>
          <NativeSelect id="note-type" {...register("type")}>
            {noteTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </NativeSelect>
        </div>
      </div>

      {patient && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-surface-2 px-4 py-3 text-xs">
          <span className="font-semibold">
            {patient.name}, {patient.age}
            {patient.sex}
          </span>
          <span className="text-muted-foreground">{patient.condition}</span>
          <NewsBadge score={latest[patient.id]?.news ?? patient.news} />
          <AllergyBadges allergies={patient.allergies} />
        </div>
      )}

      <div className="mt-4 space-y-4">
        {sections.map((s) => (
          <div key={s.key} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={`note-${s.key}`} className="flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-md bg-brand-50 text-xs font-extrabold text-brand-800 dark:bg-brand-950 dark:text-brand-200" aria-hidden>
                  {s.letter}
                </span>
                {s.label}
                <span className="hidden text-xs font-normal text-muted-foreground sm:inline">· {s.hint}</span>
              </Label>
              {s.key === "objective" && patient && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    const cur = getValues("objective");
                    setValue("objective", cur ? `${cur}\n${vitalsLine()}` : vitalsLine(), { shouldValidate: !!errors.objective });
                  }}
                >
                  <Activity aria-hidden /> Insert latest vitals
                </Button>
              )}
            </div>
            <Textarea id={`note-${s.key}`} className="min-h-20" aria-invalid={!!errors[s.key]} {...register(s.key)} />
            <FieldError message={errors[s.key]?.message} />
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        <p className="text-xs text-muted-foreground sm:mr-auto">Signed by {author}</p>
        <Button type="button" variant="outline" onClick={saveDraft}>
          <Save aria-hidden /> Save draft
        </Button>
        <Button type="submit">
          <Signature aria-hidden /> Sign note
        </Button>
      </div>
    </form>
  );
}
