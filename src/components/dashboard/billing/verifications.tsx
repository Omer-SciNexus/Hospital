"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { BadgeCheck, CheckCircle2, CircleAlert, Clock, Loader2, SearchCheck, X, XCircle } from "lucide-react";
import { insurersById, type Insurer } from "@/data/insurers";
import { patientsById } from "@/data/patients";
import { formatDay, formatTime, timeAgo } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { useInsurance, type CardStatus, type InsuranceCard } from "@/store/insurance";
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

const tabs: { value: CardStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
];

type CheckState = "running" | "done";

/** Billing: verify insurance cards added by patients. */
export function Verifications() {
  const cards = useInsurance((s) => s.cards);
  const [tab, setTab] = useState<CardStatus>("pending");
  const [selectedId, setSelectedId] = useState<string | undefined>(() => queryParam("id"));
  const [checks, setChecks] = useState<Record<string, CheckState>>({});
  const [panelRef, scrollToPanel] = useScrollToPanel();

  const lists = useMemo(() => {
    const by = (status: CardStatus) => cards.filter((c) => c.status === status);
    const newest = (a: InsuranceCard, b: InsuranceCard) => (b.decidedAt ?? b.addedAt).localeCompare(a.decidedAt ?? a.addedAt);
    return {
      pending: by("pending").sort((a, b) => a.addedAt.localeCompare(b.addedAt)),
      verified: by("verified").sort(newest),
      rejected: by("rejected").sort(newest),
    };
  }, [cards]);

  const list = lists[tab];
  const selected = list.find((c) => c.id === selectedId) ?? list[0];

  function runCheck(id: string) {
    setChecks((c) => ({ ...c, [id]: "running" }));
    setTimeout(() => setChecks((c) => ({ ...c, [id]: "done" })), 1200);
  }

  function onDecided(id: string) {
    const next = nextAfter(lists.pending, id);
    setSelectedId(next && next.id !== id ? next.id : undefined);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Insurance"
        title="Card checks"
        description="Patients add their insurance cards online. Check each one with the insurer before it can be used for bookings and claims."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <Tabs value={tab} onValueChange={(v) => setTab(v as CardStatus)}>
          <TabsList aria-label="Card status" className="w-full">
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
                <EmptyState compact image="/images/dashboard/empty-insurance.png" title={t.value === "pending" ? "No cards to check" : `No ${t.label.toLowerCase()} cards`} />
              ) : (
                <QueueList
                  label={`${t.label} cards`}
                  items={lists[t.value]}
                  selectedId={selected?.id}
                  onSelect={(id, picked) => {
                    setSelectedId(id);
                    if (picked) scrollToPanel();
                  }}
                  renderItem={(c) => <CardQueueItem card={c} />}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>

        <div ref={panelRef} className="scroll-mt-20">
          {selected ? (
            <CardReview key={selected.id} card={selected} check={checks[selected.id]} onRunCheck={() => runCheck(selected.id)} onDecided={onDecided} />
          ) : (
            <Panel>
              <EmptyState image="/images/dashboard/success-order.png" title="All cards checked" description="New cards from patients will show up here." />
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function CardQueueItem({ card }: { card: InsuranceCard }) {
  const insurer = insurersById[card.insurerId];
  const patient = patientsById[card.patientId];
  return (
    <div className="flex items-start gap-3">
      {insurer ? <InsurerLogo insurer={insurer} compact /> : <Avatar name={card.holder} size={36} />}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-semibold">{patient?.name ?? card.holder}</p>
          <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(card.addedAt)}</span>
        </div>
        <p className="truncate text-sm text-muted-foreground">
          {insurer?.name ?? card.insurerId} · {card.plan}
        </p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{card.memberId}</p>
      </div>
    </div>
  );
}

/** Made-up eligibility answer, based on the insurer's typical cover. */
function eligibility(card: InsuranceCard, insurer?: Insurer) {
  const formatOk = /^[A-Z]{2,4}-\d{4}-\d{4}$/.test(card.memberId);
  const cover = insurer?.coverage ?? 70;
  return [
    { label: "Coverage", value: "Active", ok: true },
    { label: "Network", value: insurer?.network === "in-network" ? "In network" : "Partly in network", ok: insurer?.network === "in-network" },
    { label: "Plan pays (outpatient)", value: `About ${cover}%`, ok: true },
    { label: "Copay", value: cover >= 85 ? "$15 visit · $30 specialist" : cover >= 75 ? "$25 visit · $45 specialist" : "$40 visit · $60 specialist", ok: true },
    { label: "Member ID format", value: formatOk ? "Matches insurer format" : "Looks unusual, compare with the photo", ok: formatOk },
  ];
}

function CardReview({
  card,
  check,
  onRunCheck,
  onDecided,
}: {
  card: InsuranceCard;
  check?: CheckState;
  onRunCheck: () => void;
  onDecided: (id: string) => void;
}) {
  const decideCard = useInsurance((s) => s.decideCard);
  const insurer = insurersById[card.insurerId];
  const patient = patientsById[card.patientId];
  const name = patient?.name ?? card.holder;
  const [rejectOpen, setRejectOpen] = useState(false);
  const pending = card.status === "pending";
  const result = check === "done" ? eligibility(card, insurer) : null;

  function verify() {
    decideCard(card.id, "verified");
    toast.success("Card verified", { description: `${name} can now use ${insurer?.name ?? "this plan"} for bookings and orders.` });
    onDecided(card.id);
  }

  function reject(note: string) {
    decideCard(card.id, "rejected", note);
    toast(`Card rejected for ${name}`, { description: "The patient sees the reason and can upload the card again." });
    setRejectOpen(false);
    onDecided(card.id);
  }

  const details: [string, React.ReactNode][] = [
    ["Insurer", insurer?.name ?? card.insurerId],
    ["Plan", card.plan],
    ["Member ID", <span key="m" className="font-mono">{card.memberId}</span>],
    ["Group no.", <span key="g" className="font-mono">{card.groupNumber}</span>],
    ["Card holder", card.holder],
    ["Primary card", card.primary ? "Yes" : "No"],
  ];

  return (
    <div className="space-y-5">
      <Panel
        title={
          <span className="flex flex-wrap items-center gap-2">
            {name} <StatusBadge status={card.status} />
          </span>
        }
        description={`Added ${formatDay(card.addedAt)}, ${formatTime(card.addedAt)}${patient ? ` · ${patient.mrn}` : ""}`}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div
            className="relative aspect-[1.6] overflow-hidden rounded-2xl p-5 text-white shadow-lift"
            style={{ background: `linear-gradient(135deg, ${insurer?.color ?? "#0f766e"}, #0b1f24)` }}
            aria-label={`Digital copy of the ${insurer?.name ?? ""} card`}
            role="img"
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-extrabold">{insurer?.name ?? card.insurerId}</span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">{card.plan}</span>
            </div>
            <div className="absolute inset-x-5 bottom-5">
              <p className="text-[11px] uppercase tracking-widest text-white/70">Member ID</p>
              <p className="font-mono text-lg font-bold tracking-wider">{card.memberId}</p>
              <div className="mt-2 flex justify-between gap-2 text-xs">
                <span className="truncate">{card.holder}</span>
                <span className="font-mono text-white/80">{card.groupNumber}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col rounded-2xl border border-dashed border-border bg-muted/40 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Card photo</p>
            <div className="grid flex-1 place-items-center py-2">
              <Image src="/images/dashboard/upload-insurance-card.png" alt="" width={160} height={160} className="size-28 object-contain" />
            </div>
            <p className="truncate text-center text-sm font-medium">{card.photo ?? "card-front.jpg"}</p>
            <p className="text-center text-xs text-muted-foreground">Uploaded by the patient</p>
          </div>
        </div>

        <dl className="mt-5 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          {details.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 border-b border-border pb-2">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="text-right font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        {patient && card.holder !== patient.name && (
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-coral-50 p-3 text-sm text-coral-700 dark:bg-orange-950 dark:text-orange-200">
            <CircleAlert className="size-4 shrink-0" aria-hidden /> Card holder is not the patient. Check they are a dependant on the plan.
          </p>
        )}
      </Panel>

      <Panel
        title="Eligibility check"
        description="Asks the insurer if the plan is active and in network."
        action={
          <Button size="sm" variant={result ? "outline" : "primary"} onClick={onRunCheck} disabled={check === "running"}>
            {check === "running" ? <Loader2 className="animate-spin" aria-hidden /> : <SearchCheck aria-hidden />}
            {check === "running" ? "Checking…" : result ? "Run again" : "Run eligibility check"}
          </Button>
        }
      >
        <div aria-live="polite">
          {check === "running" && (
            <ul className="space-y-2" aria-label="Checking with the insurer">
              {[0, 1, 2].map((i) => (
                <li key={i} className="h-9 animate-pulse rounded-xl bg-muted" />
              ))}
            </ul>
          )}
          {!check && <p className="text-sm text-muted-foreground">Run the check before you verify the card.</p>}
          {result && (
            <ul className="space-y-2">
              {result.map((r) => (
                <li key={r.label} className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2 text-sm">
                  {r.ok ? (
                    <CheckCircle2 className="size-4 shrink-0 text-green-600" aria-hidden />
                  ) : (
                    <CircleAlert className="size-4 shrink-0 text-coral-600" aria-hidden />
                  )}
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className="ml-auto text-right font-semibold">{r.value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>

      {pending ? (
        <div className="flex flex-col-reverse gap-2 rounded-2xl border border-border bg-surface p-4 shadow-soft sm:flex-row sm:items-center sm:justify-end">
          <p className="text-xs text-muted-foreground sm:mr-auto">{result ? "Eligibility confirmed. Ready to decide." : "Verify unlocks after the eligibility check."}</p>
          <Button variant="outline" onClick={() => setRejectOpen(true)}>
            <X aria-hidden /> Reject
          </Button>
          <Button onClick={verify} disabled={!result}>
            <BadgeCheck aria-hidden /> Verify card
          </Button>
        </div>
      ) : (
        <Panel>
          <div className="flex items-start gap-3">
            {card.status === "verified" ? (
              <CheckCircle2 className="size-6 shrink-0 text-green-600" aria-hidden />
            ) : (
              <XCircle className="size-6 shrink-0 text-red-600" aria-hidden />
            )}
            <div>
              <p className="font-bold">{card.status === "verified" ? "Verified" : "Rejected"}</p>
              {card.decidedAt && (
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="size-3.5" aria-hidden /> {formatDay(card.decidedAt)}, {formatTime(card.decidedAt)}
                </p>
              )}
              {card.note && <p className="mt-2 text-sm">“{card.note}”</p>}
            </div>
          </div>
        </Panel>
      )}

      <RejectCardDialog open={rejectOpen} onOpenChange={setRejectOpen} onReject={reject} name={name} />
    </div>
  );
}

const presets = [
  { id: "member", label: "Member ID does not match", note: "Member ID does not match the insurer's records. Please check the number and upload the front of the card again." },
  { id: "expired", label: "Card expired", note: "This card has expired. Please add your new card." },
  { id: "photo", label: "Photo unreadable", note: "We could not read the card photo. Please upload a clear photo of the front and back." },
  { id: "other", label: "Other", note: "" },
] as const;

const otherSchema = z.string().trim().min(10, "Please write a short reason (at least 10 characters).");

function RejectCardDialog({
  open,
  onOpenChange,
  onReject,
  name,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onReject: (note: string) => void;
  name: string;
}) {
  const [choice, setChoice] = useState<(typeof presets)[number]["id"]>("member");
  const [other, setOther] = useState("");
  const [error, setError] = useState<string>();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (choice === "other") {
      const parsed = otherSchema.safeParse(other);
      if (!parsed.success) return setError(parsed.error.issues[0]?.message);
      onReject(parsed.data);
    } else {
      onReject(presets.find((p) => p.id === choice)!.note);
    }
    setOther("");
    setError(undefined);
    setChoice("member");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Reject card</DialogTitle>
        <DialogDescription>{name} will see this reason on their insurance page.</DialogDescription>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold">Reason</legend>
            {presets.map((p) => (
              <label
                key={p.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-colors",
                  choice === p.id ? "border-brand-500 bg-brand-50 dark:bg-brand-950" : "border-border hover:border-brand-300",
                )}
              >
                <input
                  type="radio"
                  name="reject-reason"
                  value={p.id}
                  checked={choice === p.id}
                  onChange={() => {
                    setChoice(p.id);
                    setError(undefined);
                  }}
                  className="mt-0.5 accent-brand-600"
                />
                <span>
                  <span className="block font-semibold">{p.label}</span>
                  {p.note && <span className="block text-xs text-muted-foreground">{p.note}</span>}
                </span>
              </label>
            ))}
          </fieldset>
          {choice === "other" && (
            <div className="space-y-1.5">
              <Label htmlFor="card-reject-other">Message to the patient</Label>
              <Textarea id="card-reject-other" value={other} onChange={(e) => setOther(e.target.value)} aria-invalid={!!error} className="min-h-24" autoFocus />
              <FieldError message={error} />
            </div>
          )}
          <DialogFooter className="mt-0">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger">
              Reject card
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

