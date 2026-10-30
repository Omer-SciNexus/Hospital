"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Check, CheckCircle2, Clock, Eye, Hourglass, X, XCircle } from "lucide-react";
import { getDepartment } from "@/config/departments";
import { doctorsById } from "@/data/doctors";
import { insurersById } from "@/data/insurers";
import { patientsById } from "@/data/patients";
import { formatDay, formatTime, timeAgo } from "@/lib/dates";
import { cn, formatPrice } from "@/lib/utils";
import { useInsurance, type Preapproval } from "@/store/insurance";
import { PageHeader, Panel } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { InsurerLogo } from "@/components/marketing/insurer-logo";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { FieldError, Label, Textarea } from "@/components/ui/form-controls";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QueueList, nextAfter, queryParam, useScrollToPanel } from "@/components/dashboard/pharmacy/queue-list";

type View = "open" | "decided";
const isOpen = (p: Preapproval) => p.status === "requested" || p.status === "in-review";

/** Insurer's likely share for a procedure, from the plan's typical cover. */
export function coverageEstimate(p: Preapproval) {
  const insurer = insurersById[p.insurerId];
  const share = insurer ? Math.round(insurer.coverage * (insurer.network === "partial" ? 0.85 : 1)) : 0;
  const pays = Math.round((p.estimatedCost * share) / 100);
  return { share, pays, patient: p.estimatedCost - pays };
}

/** Billing: pre-approval requests from doctors, decided with the insurer. */
export function PreapprovalsScreen() {
  const preapprovals = useInsurance((s) => s.preapprovals);
  const [view, setView] = useState<View>("open");
  const [selectedId, setSelectedId] = useState<string | undefined>(() => queryParam("id"));
  const [panelRef, scrollToPanel] = useScrollToPanel();

  const lists = useMemo(
    () => ({
      // Urgent first, then the longest waiting.
      open: preapprovals
        .filter(isOpen)
        .sort((a, b) => Number(b.urgency === "urgent") - Number(a.urgency === "urgent") || a.requestedAt.localeCompare(b.requestedAt)),
      decided: preapprovals.filter((p) => !isOpen(p)).sort((a, b) => (b.decidedAt ?? b.requestedAt).localeCompare(a.decidedAt ?? a.requestedAt)),
    }),
    [preapprovals],
  );
  const list = lists[view];
  const selected = list.find((p) => p.id === selectedId) ?? list[0];

  function onDecided(id: string) {
    const next = nextAfter(lists.open, id);
    setSelectedId(next && next.id !== id ? next.id : undefined);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Insurance"
        title="Pre-approvals"
        description="Doctors ask for approval before planned procedures. Confirm with the insurer and record the answer. Urgent requests come first."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <Tabs value={view} onValueChange={(v) => setView(v as View)}>
          <TabsList aria-label="Pre-approval status" className="w-full">
            <TabsTrigger value="open" className="flex-1">
              Waiting <span className="rounded-full bg-background px-1.5 text-xs tabular-nums">{lists.open.length}</span>
            </TabsTrigger>
            <TabsTrigger value="decided" className="flex-1">
              Decided <span className="rounded-full bg-background px-1.5 text-xs tabular-nums">{lists.decided.length}</span>
            </TabsTrigger>
          </TabsList>
          {(["open", "decided"] as const).map((v) => (
            <TabsContent key={v} value={v} className="mt-4">
              {lists[v].length === 0 ? (
                <EmptyState
                  compact
                  image="/images/dashboard/preapproval.png"
                  title={v === "open" ? "No requests waiting" : "Nothing decided yet"}
                  description={v === "open" ? "New requests from doctors appear here." : undefined}
                />
              ) : (
                <QueueList
                  label={v === "open" ? "Waiting pre-approvals" : "Decided pre-approvals"}
                  items={lists[v]}
                  selectedId={selected?.id}
                  onSelect={(id, picked) => {
                    setSelectedId(id);
                    if (picked) scrollToPanel();
                  }}
                  renderItem={(p) => <PreapprovalItem p={p} />}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>

        <div ref={panelRef} className="scroll-mt-20">
          {selected ? (
            <PreapprovalDetail key={selected.id} p={selected} onDecided={onDecided} />
          ) : (
            <Panel>
              <EmptyState image="/images/dashboard/preapproval.png" title="All requests answered" description="You're up to date. New requests will show up here." />
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function PreapprovalItem({ p }: { p: Preapproval }) {
  const patient = patientsById[p.patientId];
  const open = isOpen(p);
  return (
    <div className={cn("border-l-4 pl-3", p.urgency === "urgent" && open ? "border-red-500" : "border-transparent")}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold leading-snug">{p.procedure}</p>
        <span className="shrink-0 font-display text-sm font-bold tabular-nums">{formatPrice(p.estimatedCost)}</span>
      </div>
      <p className="mt-0.5 text-sm text-muted-foreground">
        {patient?.name ?? p.patientId} · {insurersById[p.insurerId]?.name}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <StatusBadge status={p.urgency} />
        <StatusBadge status={p.status} />
        {open && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Hourglass className="size-3" aria-hidden /> waiting {timeAgo(p.requestedAt).replace(" ago", "")}
          </span>
        )}
      </div>
    </div>
  );
}

function PreapprovalDetail({ p, onDecided }: { p: Preapproval; onDecided: (id: string) => void }) {
  const decide = useInsurance((s) => s.decidePreapproval);
  const patient = patientsById[p.patientId];
  const doctor = doctorsById[p.doctorId];
  const insurer = insurersById[p.insurerId];
  const department = getDepartment(p.department);
  const est = coverageEstimate(p);
  const [dialog, setDialog] = useState<"approve" | "deny" | null>(null);
  const open = isOpen(p);
  const name = patient?.name ?? p.patientId;

  function startReview() {
    decide(p.id, "in-review");
    toast("Review started", { description: `${p.id} sent to ${insurer?.name ?? "the insurer"} for a decision.` });
  }

  function finish(status: "approved" | "denied", note?: string) {
    decide(p.id, status, note);
    if (status === "approved") toast.success("Pre-approval approved", { description: `${name} and ${doctor?.name ?? "the doctor"} can book ${p.procedure}.` });
    else toast.error("Pre-approval denied", { description: `${doctor?.name ?? "The doctor"} and ${name} have been told why.` });
    setDialog(null);
    onDecided(p.id);
  }

  return (
    <div className="space-y-5">
      <Panel bodyClassName="p-0">
        <div className="flex flex-col gap-4 border-b border-border bg-gradient-to-br from-brand-50 to-blue-50 p-6 sm:flex-row sm:items-center dark:from-brand-950 dark:to-blue-950">
          <Image src="/images/dashboard/preapproval.png" alt="" width={140} height={140} className="size-24 shrink-0" />
          <div className="min-w-0">
            <p className="font-mono text-xs font-bold text-primary">{p.id}</p>
            <h2 className="mt-0.5 text-xl font-extrabold">{p.procedure}</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <StatusBadge status={p.urgency} />
              <StatusBadge status={p.status} />
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5" aria-hidden /> Requested {formatDay(p.requestedAt)}, {formatTime(p.requestedAt)} ({timeAgo(p.requestedAt)})
            </p>
          </div>
        </div>

        <div className="grid gap-5 p-6 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <Avatar name={name} src={patient?.avatar} size={44} />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Patient</p>
              <p className="font-semibold">{name}</p>
              {patient && (
                <p className="text-xs text-muted-foreground">
                  {patient.age} y · {patient.mrn}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Avatar name={doctor?.name ?? "Doctor"} src={doctor?.photo} size={44} />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Requested by</p>
              <p className="font-semibold">{doctor?.name ?? p.doctorId}</p>
              <p className="text-xs text-muted-foreground">{department?.name ?? p.department}</p>
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Cost estimate" description="Based on the plan's usual cover. The insurer confirms the final amount.">
        {insurer && <InsurerLogo insurer={insurer} className="text-sm" />}
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-muted/60 p-3">
            <dt className="text-xs text-muted-foreground">Estimated cost</dt>
            <dd className="font-display text-xl font-extrabold tabular-nums">{formatPrice(p.estimatedCost)}</dd>
          </div>
          <div className="rounded-xl bg-brand-50 p-3 dark:bg-brand-950">
            <dt className="text-xs text-brand-800 dark:text-brand-200">Insurer covers (~{est.share}%)</dt>
            <dd className="font-display text-xl font-extrabold tabular-nums text-brand-800 dark:text-brand-200">{formatPrice(est.pays)}</dd>
          </div>
          <div className="rounded-xl bg-coral-50 p-3 dark:bg-orange-950">
            <dt className="text-xs text-coral-700 dark:text-orange-200">Patient pays</dt>
            <dd className="font-display text-xl font-extrabold tabular-nums text-coral-700 dark:text-orange-200">{formatPrice(est.patient)}</dd>
          </div>
        </dl>
        {insurer?.network === "partial" && (
          <p className="mt-3 text-xs text-muted-foreground">{insurer.name} is only partly in network, so cover is a bit lower.</p>
        )}
      </Panel>

      {open ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 shadow-soft sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {p.status === "requested" && (
            <Button variant="secondary" onClick={startReview} className="sm:mr-auto">
              <Eye aria-hidden /> Start review
            </Button>
          )}
          <Button variant="outline" onClick={() => setDialog("deny")}>
            <X aria-hidden /> Deny
          </Button>
          <Button onClick={() => setDialog("approve")}>
            <Check aria-hidden /> Approve
          </Button>
        </div>
      ) : (
        <Panel>
          <div className="flex items-start gap-3">
            {p.status === "approved" ? <CheckCircle2 className="size-6 shrink-0 text-green-600" aria-hidden /> : <XCircle className="size-6 shrink-0 text-red-600" aria-hidden />}
            <div>
              <p className="font-bold">{p.status === "approved" ? "Approved" : "Denied"}</p>
              {p.decidedAt && (
                <p className="text-sm text-muted-foreground">
                  {formatDay(p.decidedAt)}, {formatTime(p.decidedAt)}
                </p>
              )}
              {p.note && <p className="mt-2 text-sm">“{p.note}”</p>}
            </div>
          </div>
        </Panel>
      )}

      <DecisionDialog mode={dialog} procedure={p.procedure} onClose={() => setDialog(null)} onConfirm={finish} />
    </div>
  );
}

function DecisionDialog({
  mode,
  procedure,
  onClose,
  onConfirm,
}: {
  mode: "approve" | "deny" | null;
  procedure: string;
  onClose: () => void;
  onConfirm: (status: "approved" | "denied", note?: string) => void;
}) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const deny = mode === "deny";

  function close() {
    setNote("");
    setError(undefined);
    onClose();
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (deny) {
      const parsed = z.string().trim().min(10, "Please explain why (at least 10 characters).").safeParse(note);
      if (!parsed.success) return setError(parsed.error.issues[0]?.message);
      onConfirm("denied", parsed.data);
    } else {
      onConfirm("approved", note.trim() || undefined);
    }
    setNote("");
    setError(undefined);
  }

  return (
    <Dialog open={!!mode} onOpenChange={(v) => !v && close()}>
      <DialogContent>
        <DialogTitle>{deny ? "Deny pre-approval" : "Approve pre-approval"}</DialogTitle>
        <DialogDescription>{procedure}</DialogDescription>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pa-note">{deny ? "Reason (required)" : "Note (optional)"}</Label>
            <Textarea
              id="pa-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              aria-invalid={!!error}
              className="min-h-24"
              placeholder={deny ? "e.g. Plan does not cover this procedure." : "e.g. Approved for up to 3 nights' stay."}
              autoFocus
            />
            <FieldError message={error} />
          </div>
          <DialogFooter className="mt-0">
            <Button type="button" variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" variant={deny ? "danger" : "primary"}>
              {deny ? "Deny request" : "Approve request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
