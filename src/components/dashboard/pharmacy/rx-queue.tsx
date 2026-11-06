"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AlertTriangle, Check, CheckCircle2, Clock, FileText, Maximize2, Phone, ShieldCheck, X } from "lucide-react";
import { roles } from "@/config/navigation";
import { doctorsById } from "@/data/doctors";
import { insurersById } from "@/data/insurers";
import { patientsById } from "@/data/patients";
import { formatDay, formatTime, timeAgo } from "@/lib/dates";
import { cn, formatPrice } from "@/lib/utils";
import { useOrders, type Order, type RxStatus, RX_UPLOAD_ID } from "@/store/orders";
import { useSession } from "@/store/session";
import { PageHeader, Panel } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { InsurerLogo } from "@/components/marketing/insurer-logo";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { FieldError, Label, Textarea } from "@/components/ui/form-controls";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QueueList, nextAfter, queryParam, useScrollToPanel } from "./queue-list";
import { currentMedicines, rxWarnings } from "./rx-checks";

const tabs: { value: RxStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

/** Pharmacist's prescription check queue for marketplace orders. */
export function RxQueue() {
  const orders = useOrders((s) => s.orders);
  const [tab, setTab] = useState<RxStatus>("pending");
  const [selectedId, setSelectedId] = useState<string | undefined>(() => queryParam("id"));
  const [panelRef, scrollToPanel] = useScrollToPanel();

  const lists = useMemo(() => {
    const rx = orders.filter((o) => o.rx);
    const by = (status: RxStatus) => rx.filter((o) => o.rx!.status === status);
    const newest = (a: Order, b: Order) => (b.rx!.reviewedAt ?? b.createdAt).localeCompare(a.rx!.reviewedAt ?? a.createdAt);
    return {
      // Oldest first: first in, first out.
      pending: by("pending").sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      approved: by("approved").sort(newest),
      rejected: by("rejected").sort(newest),
    };
  }, [orders]);

  const list = lists[tab];
  const selected = list.find((o) => o.id === selectedId) ?? list[0];

  function onDecided(id: string) {
    const next = nextAfter(lists.pending, id);
    setSelectedId(next && next.id !== id ? next.id : undefined);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Pharmacy"
        title="Prescriptions to verify"
        description="Check each uploaded prescription before the order is packed. Approved orders move to packing; the patient sees your decision right away."
        actions={
          <p className="hidden items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground lg:inline-flex">
            <kbd className="font-sans font-bold">↑</kbd>
            <kbd className="font-sans font-bold">↓</kbd> move through the queue
          </p>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <Tabs value={tab} onValueChange={(v) => setTab(v as RxStatus)}>
          <TabsList aria-label="Prescription status" className="w-full">
            {tabs.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="flex-1">
                {t.label}
                <span className="rounded-full bg-background px-1.5 text-xs tabular-nums">{lists[t.value].length}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((t) => (
            <TabsContent key={t.value} value={t.value} className="mt-4">
              {lists[t.value].length === 0 ? (
                <EmptyState
                  compact
                  image="/images/dashboard/empty-orders.png"
                  title={t.value === "pending" ? "Queue is clear" : `No ${t.label.toLowerCase()} prescriptions`}
                  description={t.value === "pending" ? "New prescriptions from the marketplace show up here." : undefined}
                />
              ) : (
                <QueueList
                  label={`${t.label} prescriptions`}
                  items={lists[t.value]}
                  selectedId={selected?.id}
                  onSelect={(id, picked) => {
                    setSelectedId(id);
                    if (picked) scrollToPanel();
                  }}
                  renderItem={(o) => <RxQueueItem order={o} />}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>

        <div ref={panelRef} className="scroll-mt-20">
          {selected ? (
            <RxReview key={selected.id} order={selected} onDecided={onDecided} />
          ) : (
            <Panel>
              <EmptyState image="/images/dashboard/success-order.png" title="All prescriptions checked" description="Nice work. Nothing is waiting for review." />
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function RxQueueItem({ order }: { order: Order }) {
  const patient = patientsById[order.patientId];
  const warnings = rxWarnings(order, patient);
  const rxLines = order.lines.filter((l) => l.rx);
  return (
    <div className="flex items-start gap-3">
      <Avatar name={order.patientName} src={patient?.avatar} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-semibold">{order.patientName}</p>
          <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(order.createdAt)}</span>
        </div>
        <p className="truncate text-sm text-muted-foreground">{rxLines.map((l) => l.name.split(",")[0]).join(" · ") || "Prescription"}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-xs text-muted-foreground">{order.id}</span>
          {warnings.length > 0 && (
            <Badge variant="red">
              <AlertTriangle aria-hidden /> {warnings.length} warning{warnings.length > 1 ? "s" : ""}
            </Badge>
          )}
          {order.rx!.status !== "pending" && <StatusBadge status={order.rx!.status} />}
        </div>
      </div>
    </div>
  );
}

const checks = [
  { id: "signature", label: "Prescriber signature and license number are present" },
  { id: "date", label: "Prescription is dated within the last 6 months" },
  { id: "dose", label: "Medicine, strength and dose match the order" },
  { id: "interaction", label: "No allergy or interaction problem" },
] as const;

function RxReview({ order, onDecided }: { order: Order; onDecided: (id: string) => void }) {
  const reviewRx = useOrders((s) => s.reviewRx);
  const profile = useSession((s) => s.profile);
  const reviewer = profile?.name || roles.find((r) => r.id === "pharmacist")!.person;
  const patient = patientsById[order.patientId];
  const doctor = patient ? doctorsById[patient.doctorId] : undefined;
  const insurer = order.insurerId ? insurersById[order.insurerId] : undefined;
  const warnings = rxWarnings(order, patient);
  const meds = currentMedicines[order.patientId] ?? [];
  const rx = order.rx!;
  const pending = rx.status === "pending";

  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const allTicked = checks.every((c) => ticked[c.id]);

  function approve() {
    reviewRx(order.id, "approved", { reviewedBy: reviewer });
    toast.success(`Prescription approved for ${order.patientName}`, { description: `${order.id} moves to packing. The patient can see it now.` });
    onDecided(order.id);
  }

  function reject(note: string) {
    reviewRx(order.id, "rejected", { note, reviewedBy: reviewer });
    toast(`Prescription rejected for ${order.patientName}`, { description: "The patient was told why and can upload a new one." });
    setRejectOpen(false);
    onDecided(order.id);
  }

  return (
    <div className="space-y-5">
      <Panel
        title={
          <span className="flex flex-wrap items-center gap-2">
            Order {order.id} <StatusBadge status={rx.status} />
          </span>
        }
        description={`Placed ${formatDay(order.createdAt)}, ${formatTime(order.createdAt)} · ${order.address}`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar name={order.patientName} src={patient?.avatar} size={56} />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold">{order.patientName}</p>
            <p className="text-sm text-muted-foreground">
              {patient ? `${patient.age} y · ${patient.sex === "F" ? "Female" : "Male"} · ${patient.mrn}` : "Marketplace customer"}
              {patient && ` · ${patient.condition}`}
            </p>
          </div>
          {insurer && <InsurerLogo insurer={insurer} className="text-sm" />}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Allergies</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {patient && patient.allergies.length > 0 ? (
                patient.allergies.map((a) => (
                  <Badge key={a} variant="red">
                    {a}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No known allergies</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Current medicines</p>
            {meds.length ? (
              <ul className="mt-2 space-y-1 text-sm">
                {meds.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">None on file</p>
            )}
          </div>
        </div>

        {warnings.length > 0 ? (
          <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            <p className="flex items-center gap-2 font-bold">
              <AlertTriangle className="size-5" aria-hidden /> Safety warning{warnings.length > 1 ? "s" : ""}
            </p>
            <ul className="mt-2 space-y-2 text-sm">
              {warnings.map((w) => (
                <li key={w.title}>
                  <span className="font-semibold">{w.title}.</span> {w.detail}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-5 flex items-center gap-2 rounded-2xl bg-green-50 p-3 text-sm font-medium text-green-800 dark:bg-green-950 dark:text-green-200">
            <ShieldCheck className="size-5 shrink-0" aria-hidden /> No allergy or interaction found for this order.
          </p>
        )}
      </Panel>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Uploaded prescription" description="Check it against the order lines.">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="group relative grid aspect-[3/4] w-28 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-white shadow-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
              aria-label={`Open ${rx.fileName} full size`}
            >
              <Image src="/images/dashboard/upload-rx.png" alt="" width={160} height={160} className="size-24 object-contain" />
              <span className="absolute inset-0 grid place-items-center bg-brand-950/0 text-white transition-colors group-hover:bg-brand-950/40">
                <Maximize2 className="size-5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
              </span>
            </button>
            <div className="min-w-0 text-sm">
              <p className="flex items-center gap-1.5 font-semibold">
                <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="truncate">{rx.fileName}</span>
              </p>
              <p className="mt-1 text-muted-foreground">
                Uploaded {timeAgo(order.createdAt)} {order.lines.some((l) => l.productId === RX_UPLOAD_ID) ? "from the patient portal" : "at checkout"}
              </p>
              {rx.patientNote && <p className="mt-2">Patient note: “{rx.patientNote}”</p>}
              <p className="mt-3 text-muted-foreground">Prescriber</p>
              <p className="font-semibold">{doctor?.name ?? "External doctor"}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => toast(`Calling ${doctor?.name ?? "the prescriber"}…`, { description: "We'll log the call on this order." })}
              >
                <Phone aria-hidden /> Call prescriber
              </Button>
            </div>
          </div>
        </Panel>

        <Panel title="Order lines" bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {order.lines.map((l) => (
              <li key={l.productId} className="flex items-center gap-3 px-5 py-3">
                <Image src={l.image} alt="" width={40} height={40} className="size-10 shrink-0 rounded-lg bg-muted object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{l.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Qty {l.quantity} · {formatPrice(l.price)}
                    {l.coverage > 0 && ` · insurance ${l.coverage}%`}
                  </p>
                </div>
                {l.rx ? <Badge variant="coral">Rx</Badge> : <Badge variant="muted">No Rx</Badge>}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {pending ? (
        <Panel title="Checklist" description="Tick every item to approve.">
          <fieldset>
            <legend className="sr-only">Prescription checklist</legend>
            <ul className="space-y-3">
              {checks.map((c) => {
                const label = c.id === "interaction" && warnings.length ? "Warning reviewed and cleared with the prescriber" : c.label;
                return (
                  <li key={c.id} className="flex items-start gap-3">
                    <Checkbox
                      id={`chk-${c.id}`}
                      checked={!!ticked[c.id]}
                      onCheckedChange={(v) => setTicked((t) => ({ ...t, [c.id]: v === true }))}
                      className="mt-0.5"
                    />
                    <Label htmlFor={`chk-${c.id}`} className={cn("font-medium", c.id === "interaction" && warnings.length && "text-red-700 dark:text-red-300")}>
                      {label}
                    </Label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            <p className="text-xs text-muted-foreground sm:mr-auto">
              {checks.filter((c) => ticked[c.id]).length} of {checks.length} checked
            </p>
            <Button variant="outline" onClick={() => setRejectOpen(true)}>
              <X aria-hidden /> Reject
            </Button>
            <Button onClick={approve} disabled={!allTicked}>
              <Check aria-hidden /> Approve prescription
            </Button>
          </div>
        </Panel>
      ) : (
        <Panel>
          <div className="flex items-start gap-3">
            {rx.status === "approved" ? (
              <CheckCircle2 className="size-6 shrink-0 text-green-600" aria-hidden />
            ) : (
              <X className="size-6 shrink-0 text-red-600" aria-hidden />
            )}
            <div>
              <p className="font-bold">{rx.status === "approved" ? "Approved" : "Rejected"}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="size-3.5" aria-hidden />
                {rx.reviewedBy ?? "Pharmacist"}
                {rx.reviewedAt && ` · ${formatDay(rx.reviewedAt)}, ${formatTime(rx.reviewedAt)}`}
              </p>
              {rx.note && <p className="mt-2 text-sm">“{rx.note}”</p>}
            </div>
          </div>
        </Panel>
      )}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent size="lg">
          <DialogTitle>{rx.fileName}</DialogTitle>
          <DialogDescription>Prescription uploaded by {order.patientName}.</DialogDescription>
          <div className="mt-5 grid place-items-center rounded-2xl border border-border bg-white p-6">
            <Image src="/images/dashboard/upload-rx.png" alt={`Prescription preview for ${order.patientName}`} width={420} height={420} className="h-auto w-full max-w-sm" />
          </div>
        </DialogContent>
      </Dialog>

      <RejectDialog open={rejectOpen} onOpenChange={setRejectOpen} onReject={reject} patient={order.patientName} />
    </div>
  );
}

const rejectSchema = z.string().trim().min(10, "Please write a short reason (at least 10 characters).");
const rejectPresets = [
  "Prescriber signature missing.",
  "Prescription is older than 6 months.",
  "Image is unreadable. Please upload a clearer photo.",
  "Dose on the prescription does not match the order.",
  "Allergy or interaction risk. The prescriber will be contacted.",
];

function RejectDialog({
  open,
  onOpenChange,
  onReject,
  patient,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onReject: (note: string) => void;
  patient: string;
}) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = rejectSchema.safeParse(note);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message);
    onReject(parsed.data);
    setNote("");
    setError(undefined);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Reject prescription</DialogTitle>
        <DialogDescription>{patient} will see this reason on their order.</DialogDescription>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {rejectPresets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setNote(p);
                  setError(undefined);
                }}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  note === p ? "border-brand-500 bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200" : "border-border hover:border-brand-400",
                )}
              >
                {p.replace(/\.$/, "").split(".")[0]}
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rx-reject-note">Reason</Label>
            <Textarea
              id="rx-reject-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              aria-invalid={!!error}
              className="min-h-24"
              placeholder="Tell the patient what to fix"
            />
            <FieldError message={error} />
          </div>
          <DialogFooter className="mt-0">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger">
              Reject prescription
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
