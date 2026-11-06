"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AlertTriangle, ArrowRight, CalendarClock, FlaskConical, Printer, TestTube, Timer } from "lucide-react";
import { patientsById } from "@/data/patients";
import { formatDay, formatTime, timeAgo } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { useOrders, type LabStatus, type Order } from "@/store/orders";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { FieldError, Label, NativeSelect, Textarea } from "@/components/ui/form-controls";

export const labColumns: { status: LabStatus; label: string; hint: string; next?: { status: LabStatus; label: string } }[] = [
  { status: "scheduled", label: "Scheduled", hint: "Waiting for sample", next: { status: "collected", label: "Mark collected" } },
  { status: "collected", label: "Collected", hint: "Sample in the lab", next: { status: "processing", label: "Start processing" } },
  { status: "processing", label: "Processing", hint: "On the analyser", next: { status: "resulted", label: "Enter result" } },
  { status: "resulted", label: "Resulted", hint: "Sent to patient and doctor" },
];

/** Result notes flagged as abnormal start with this word (also catches "low"/"high" in older notes). */
export const isAbnormal = (note?: string) => !!note && /^abnormal|\b(low|high)\b/i.test(note);

const kindOf = (category: string) => (category === "health-packages" ? "package" : "test");

/** Lab sample board: scheduled → collected → processing → resulted. */
export function LabQueue() {
  const orders = useOrders((s) => s.orders);
  const setLabStatus = useOrders((s) => s.setLabStatus);
  const [kind, setKind] = useState("all");
  const [test, setTest] = useState("all");
  const [resulting, setResulting] = useState<Order | null>(null);

  const labOrders = useMemo(() => orders.filter((o) => o.lab), [orders]);
  const testNames = useMemo(() => Array.from(new Set(labOrders.flatMap((o) => o.lines.map((l) => l.name)))).sort(), [labOrders]);

  const visible = labOrders.filter(
    (o) =>
      (kind === "all" || o.lines.some((l) => kindOf(l.category) === kind)) && (test === "all" || o.lines.some((l) => l.name === test)),
  );

  function move(order: Order, status: LabStatus) {
    if (status === "resulted") return setResulting(order);
    setLabStatus(order.id, status);
    toast.success(status === "collected" ? `Sample ${order.lab!.sampleId} collected` : `${order.lab!.sampleId} is processing`, {
      description: `${order.patientName} · ${order.lines.map((l) => l.name).join(", ")}`,
    });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Laboratory"
        title="Lab queue"
        description="Move each sample along as you work. Results go to the patient's records and their doctor."
      />

      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-soft sm:flex-row sm:items-end">
        <div role="group" aria-label="Order type" className="flex flex-wrap gap-1 rounded-full bg-muted p-1">
          {[
            { v: "all", l: "All" },
            { v: "test", l: "Single tests" },
            { v: "package", l: "Health packages" },
          ].map((k) => (
            <button
              key={k.v}
              type="button"
              aria-pressed={kind === k.v}
              onClick={() => setKind(k.v)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition-all",
                kind === k.v ? "bg-surface text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {k.l}
            </button>
          ))}
        </div>
        <div className="space-y-1.5 sm:ml-auto sm:w-72">
          <Label htmlFor="lab-test-filter">Test type</Label>
          <NativeSelect id="lab-test-filter" value={test} onChange={(e) => setTest(e.target.value)}>
            <option value="all">All tests</option>
            {testNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {labColumns.map((col) => {
          const items = visible
            .filter((o) => o.lab!.status === col.status)
            .sort((a, b) => (col.status === "resulted" ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt)));
          return (
            <section key={col.status} aria-labelledby={`col-${col.status}`} className="flex flex-col rounded-2xl bg-muted/60 p-3">
              <header className="flex items-center justify-between px-1 pb-3">
                <div>
                  <h2 id={`col-${col.status}`} className="text-sm font-bold">
                    {col.label}
                  </h2>
                  <p className="text-xs text-muted-foreground">{col.hint}</p>
                </div>
                <span className="grid min-w-7 place-items-center rounded-full bg-surface px-2 py-0.5 text-xs font-bold tabular-nums shadow-soft">
                  {items.length}
                </span>
              </header>
              <ul className="space-y-3">
                {items.map((o) => (
                  <LabCard key={o.id} order={o} next={col.next} onMove={move} />
                ))}
              </ul>
              {items.length === 0 && (
                <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">Nothing here</p>
              )}
            </section>
          );
        })}
      </div>

      <ResultDialog
        order={resulting}
        onClose={() => setResulting(null)}
        onSave={(note) => {
          if (!resulting) return;
          setLabStatus(resulting.id, "resulted", note);
          toast.success(`Result saved for ${resulting.patientName}`, {
            description: isAbnormal(note) ? "Flagged as abnormal. The doctor has been notified." : "Sent to the patient's records.",
          });
          setResulting(null);
        }}
      />
    </div>
  );
}

function LabCard({
  order,
  next,
  onMove,
}: {
  order: Order;
  next?: { status: LabStatus; label: string };
  onMove: (o: Order, s: LabStatus) => void;
}) {
  const lab = order.lab!;
  const patient = patientsById[order.patientId];
  const abnormal = lab.status === "resulted" && isAbnormal(lab.resultNote);
  return (
    <li className="rounded-xl border border-border bg-surface p-4 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-primary">
          <TestTube className="size-3.5" aria-hidden /> {lab.sampleId}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={`Print label for ${lab.sampleId}`}
          onClick={() => toast(`Label for ${lab.sampleId} sent to printer`, { description: `${order.patientName} · ${patient?.mrn ?? order.id}` })}
        >
          <Printer aria-hidden />
        </Button>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Avatar name={order.patientName} src={patient?.avatar} size={28} />
        <p className="truncate text-sm font-semibold">{order.patientName}</p>
      </div>
      <ul className="mt-2 space-y-0.5 text-sm text-muted-foreground">
        {order.lines.map((l) => (
          <li key={l.productId} className="flex items-start gap-1.5">
            <FlaskConical className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {l.name}
          </li>
        ))}
      </ul>
      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
        {order.slot && (
          <p className="flex items-center gap-1.5">
            <CalendarClock className="size-3.5" aria-hidden /> {order.slot}
          </p>
        )}
        {lab.collectedAt && lab.status !== "scheduled" && (
          <p className="flex items-center gap-1.5">
            <Timer className="size-3.5" aria-hidden /> Collected {timeAgo(lab.collectedAt)}
            {lab.status !== "resulted" && ` · ${formatTime(lab.collectedAt)}`}
          </p>
        )}
      </div>
      {lab.status === "resulted" && lab.resultNote && (
        <div
          className={cn(
            "mt-3 rounded-lg p-2.5 text-xs",
            abnormal ? "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200" : "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200",
          )}
        >
          {abnormal && (
            <Badge variant="red" className="mb-1">
              <AlertTriangle aria-hidden /> Abnormal
            </Badge>
          )}
          <p>{lab.resultNote.replace(/^abnormal:\s*/i, "")}</p>
          {lab.collectedAt && <p className="mt-1 opacity-75">Sample from {formatDay(lab.collectedAt)}</p>}
        </div>
      )}
      {next ? (
        <Button size="sm" variant={next.status === "resulted" ? "primary" : "soft"} className="mt-3 w-full" onClick={() => onMove(order, next.status)}>
          {next.label} <ArrowRight aria-hidden />
        </Button>
      ) : (
        <div className="mt-3">
          <StatusBadge status="resulted" label="Report sent" />
        </div>
      )}
    </li>
  );
}

const noteSchema = z.string().trim().min(8, "Write a short result summary (at least 8 characters).");

function ResultDialog({ order, onClose, onSave }: { order: Order | null; onClose: () => void; onSave: (note: string) => void }) {
  const [note, setNote] = useState("");
  const [abnormal, setAbnormal] = useState(false);
  const [error, setError] = useState<string>();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = noteSchema.safeParse(note);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message);
    onSave(abnormal ? `Abnormal: ${parsed.data}` : parsed.data);
    setNote("");
    setAbnormal(false);
    setError(undefined);
  }

  return (
    <Dialog
      open={!!order}
      onOpenChange={(v) => {
        if (!v) {
          setError(undefined);
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogTitle>Enter result</DialogTitle>
        <DialogDescription>
          {order && `${order.lab!.sampleId} · ${order.patientName} · ${order.lines.map((l) => l.name).join(", ")}`}
        </DialogDescription>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="lab-result-note">Result summary</Label>
            <Textarea
              id="lab-result-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              aria-invalid={!!error}
              className="min-h-28"
              placeholder="e.g. All values in normal range."
            />
            <FieldError message={error} />
          </div>
          <label
            htmlFor="lab-abnormal"
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors",
              abnormal ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950" : "border-border",
            )}
          >
            <Checkbox id="lab-abnormal" checked={abnormal} onCheckedChange={(v) => setAbnormal(v === true)} className="mt-0.5" />
            <span>
              <span className="block text-sm font-semibold">Abnormal result</span>
              <span className="block text-xs text-muted-foreground">Flags the report and alerts the ordering doctor.</span>
            </span>
          </label>
          <DialogFooter className="mt-0">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant={abnormal ? "danger" : "primary"}>
              Save and send result
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
