"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarDays, MessageCircle, Package, Pill, ShieldCheck, type LucideIcon } from "lucide-react";
import type { CareTopic } from "@/data/chat";
import { doctorsById } from "@/data/doctors";
import { DEMO_PATIENT_ID } from "@/data/patients";
import { formatDay } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { useAppointments } from "@/store/appointments";
import { useOrders } from "@/store/orders";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { FieldError, Input, Label, NativeSelect, Textarea } from "@/components/ui/form-controls";

export const topicMeta: Record<CareTopic, { label: string; icon: LucideIcon; hint: string }> = {
  appointment: { label: "Appointment", icon: CalendarDays, hint: "Your doctor" },
  order: { label: "Order", icon: Package, hint: "Pharmacy team" },
  prescription: { label: "Prescription", icon: Pill, hint: "Pharmacy team" },
  billing: { label: "Billing & insurance", icon: ShieldCheck, hint: "Billing team" },
  other: { label: "Something else", icon: MessageCircle, hint: "Your doctor" },
};

const topics = ["appointment", "order", "prescription", "billing", "other"] as const;

const schema = z.object({
  topic: z.enum(topics, { message: "Pick a topic" }),
  refId: z.string().optional(),
  title: z.string().trim().max(60, "Keep the subject short").optional(),
  message: z.string().trim().min(2, "Write a short message").max(1000, "Please keep it under 1,000 characters"),
});

type Values = z.infer<typeof schema>;

export interface NewConversation {
  topic: CareTopic;
  title: string;
  refId?: string;
  message: string;
}

/** Patient starts a private conversation with the right care team. */
export function NewConversationDialog({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (o: boolean) => void; onCreate: (c: NewConversation) => void }) {
  const appointments = useAppointments((s) => s.appointments);
  const orders = useOrders((s) => s.orders);
  const myAppointments = useMemo(() => appointments.filter((a) => a.patientId === DEMO_PATIENT_ID && a.status !== "cancelled"), [appointments]);
  const myOrders = useMemo(() => orders.filter((o) => o.patientId === DEMO_PATIENT_ID), [orders]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { topic: "appointment", refId: "", title: "", message: "" } });
  const topic = watch("topic");

  const refOptions =
    topic === "appointment"
      ? myAppointments.map((a) => ({ id: a.id, label: `${a.reason} · ${doctorsById[a.doctorId]?.name ?? ""} · ${formatDay(a.start)}` }))
      : topic === "order" || topic === "prescription"
        ? myOrders.map((o) => ({ id: o.id, label: `${o.id} · ${o.lines[0]?.name ?? "Order"}${o.lines.length > 1 ? ` +${o.lines.length - 1}` : ""}` }))
        : [];

  function submit(v: Values) {
    const appt = myAppointments.find((a) => a.id === v.refId);
    const fallback =
      v.topic === "appointment" && appt
        ? `${appt.reason} · ${doctorsById[appt.doctorId]?.name ?? "Doctor"}`
        : (v.topic === "order" || v.topic === "prescription") && v.refId
          ? `${v.topic === "order" ? "Order" : "Prescription for"} ${v.refId}`
          : { appointment: "Appointment question", order: "Order question", prescription: "Prescription question", billing: "Insurance question", other: "General question" }[v.topic];
    onCreate({ topic: v.topic, refId: v.refId || undefined, title: v.title?.trim() || fallback, message: v.message.trim() });
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent size="md">
        <DialogTitle>Start a new conversation</DialogTitle>
        <DialogDescription>Only you and your care team can read it. We usually reply within one working day.</DialogDescription>
        <form noValidate onSubmit={handleSubmit(submit)} className="mt-5 space-y-5">
          <fieldset>
            <legend className="text-sm font-semibold">What is it about?</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {topics.map((t) => {
                const meta = topicMeta[t];
                const Icon = meta.icon;
                return (
                  <label
                    key={t}
                    className={cn(
                      "flex cursor-pointer flex-col gap-1 rounded-2xl border p-3 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500",
                      topic === t ? "border-brand-500 bg-brand-50 dark:bg-brand-950" : "border-border hover:border-brand-300",
                    )}
                  >
                    <input type="radio" value={t} className="sr-only" {...register("topic", { onChange: () => setValue("refId", "") })} />
                    <Icon className="size-5 text-primary" aria-hidden />
                    <span className="font-semibold">{meta.label}</span>
                    <span className="text-xs text-muted-foreground">{meta.hint}</span>
                  </label>
                );
              })}
            </div>
            <FieldError message={errors.topic?.message} />
          </fieldset>

          {refOptions.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="nc-ref">
                Related {topic === "appointment" ? "appointment" : "order"} <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <NativeSelect id="nc-ref" {...register("refId")}>
                <option value="">None</option>
                {refOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="nc-title">
              Subject <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input id="nc-title" placeholder="For example: Question about my dose" aria-invalid={!!errors.title} {...register("title")} />
            <FieldError message={errors.title?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nc-message">Message</Label>
            <Textarea id="nc-message" className="min-h-24" placeholder="Write your question…" aria-invalid={!!errors.message} {...register("message")} />
            <FieldError message={errors.message?.message} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Start conversation</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
