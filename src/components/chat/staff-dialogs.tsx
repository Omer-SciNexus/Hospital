"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pin } from "lucide-react";
import type { Handover, StaffMessage } from "@/data/chat";
import { admittedPatients, patients, patientsById } from "@/data/patients";
import { staff, staffById } from "@/data/staff";
import { formatTime } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { FieldError, Label, NativeSelect, Textarea } from "@/components/ui/form-controls";
import { EmptyState } from "@/components/dashboard/empty-state";
import { dayLabel } from "./lib";
import { ChatAvatar, ListSearch, RichText } from "./shared";

/** Pick a colleague to start a direct message. */
export function NewDmDialog({ open, onOpenChange, meId, onPick }: { open: boolean; onOpenChange: (o: boolean) => void; meId: string; onPick: (staffId: string) => void }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return staff
      .filter((s) => s.id !== meId)
      .filter((s) => !term || `${s.name} ${s.title} ${s.department}`.toLowerCase().includes(term))
      .sort((a, b) => Number(b.presence === "online") - Number(a.presence === "online") || a.name.localeCompare(b.name));
  }, [q, meId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogTitle>New message</DialogTitle>
        <DialogDescription>Pick a colleague. Only the two of you can see the chat.</DialogDescription>
        <div className="mt-4">
          <ListSearch value={q} onChange={setQ} label="Search staff by name or role" />
        </div>
        <ul className="-mx-2 mt-3 max-h-80 overflow-y-auto">
          {list.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(s.id);
                  onOpenChange(false);
                  setQ("");
                }}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-muted focus-visible:bg-muted"
              >
                <ChatAvatar name={s.name} src={s.avatar} size={36} presence={s.presence} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{s.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {s.title} · {s.presence}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {list.length === 0 && <li className="px-2 py-6 text-center text-sm text-muted-foreground">No staff match &quot;{q}&quot;.</li>}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

/** Pinned messages of the open conversation. */
export function PinnedDialog({
  open,
  onOpenChange,
  pinned,
  onShow,
  onUnpin,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  pinned: StaffMessage[];
  onShow: (id: string) => void;
  onUnpin: (id: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogTitle>Pinned messages</DialogTitle>
        <DialogDescription>Important notes everyone should see.</DialogDescription>
        {pinned.length === 0 ? (
          <EmptyState compact image="/images/dashboard/empty-channel.png" title="Nothing pinned yet" description="Hover a message and press the pin button." />
        ) : (
          <ul className="mt-4 space-y-2">
            {pinned.map((m) => (
              <li key={m.id} className="rounded-2xl border border-border p-3">
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Pin className="size-3.5 text-amber-600" aria-hidden />
                  <span className="font-semibold text-foreground">{staffById[m.authorId]?.name}</span>
                  {dayLabel(m.createdAt)}, {formatTime(m.createdAt)}
                </p>
                <div className="mt-1 text-sm">
                  <RichText body={m.type === "handover" && m.handover ? `Handover: @[patient:${m.handover.patientId}]` : m.body} />
                </div>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="soft" onClick={() => onShow(m.id)}>
                    Show in chat
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onUnpin(m.id)}>
                    Unpin
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

const handoverSchema = z.object({
  patientId: z.string().min(1, "Choose a patient"),
  situation: z.string().trim().min(5, "Write what is happening now"),
  background: z.string().trim().min(5, "Add short background"),
  assessment: z.string().trim().min(5, "Add your assessment"),
  recommendation: z.string().trim().min(5, "Say what should happen next"),
});

type HandoverValues = z.infer<typeof handoverSchema>;

/** SBAR handover form; posts a special handover message. */
export function HandoverDialog({ open, onOpenChange, onSubmit }: { open: boolean; onOpenChange: (o: boolean) => void; onSubmit: (h: Handover) => void }) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<HandoverValues>({ resolver: zodResolver(handoverSchema), defaultValues: { patientId: "" } });
  const list = admittedPatients.length ? [...admittedPatients, ...patients.filter((p) => !p.ward)] : patients;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent size="lg">
        <DialogTitle>Send a handover</DialogTitle>
        <DialogDescription>Use SBAR: Situation, Background, Assessment, Recommendation. Keep it short.</DialogDescription>
        <form
          noValidate
          onSubmit={handleSubmit((v) => {
            onSubmit(v);
            reset();
            onOpenChange(false);
          })}
          className="mt-5 grid gap-4 sm:grid-cols-2"
        >
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="ho-patient">Patient</Label>
            <NativeSelect
              id="ho-patient"
              aria-invalid={!!errors.patientId}
              {...register("patientId", {
                onChange: (e) => {
                  const p = patientsById[e.target.value];
                  if (p) setValue("background", `${p.age} y/o, ${p.condition}. Allergies: ${p.allergies.join(", ") || "none"}.`);
                },
              })}
            >
              <option value="" disabled>
                Choose a patient
              </option>
              {list.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.mrn}
                  {p.ward ? ` · ${p.ward}, bed ${p.bed}` : ""}
                </option>
              ))}
            </NativeSelect>
            <FieldError message={errors.patientId?.message} />
          </div>
          {(
            [
              ["situation", "Situation", "What is happening right now?"],
              ["background", "Background", "Short history, allergies"],
              ["assessment", "Assessment", "What do you think is going on?"],
              ["recommendation", "Recommendation", "What should the next shift do?"],
            ] as const
          ).map(([name, label, hint]) => (
            <div key={name} className="space-y-2">
              <Label htmlFor={`ho-${name}`}>{label}</Label>
              <Textarea id={`ho-${name}`} placeholder={hint} className="min-h-20" aria-invalid={!!errors[name]} {...register(name)} />
              <FieldError message={errors[name]?.message} />
            </div>
          ))}
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Send handover</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
