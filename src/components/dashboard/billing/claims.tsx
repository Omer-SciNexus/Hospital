"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Check, Eye, Send } from "lucide-react";
import { insurers, insurersById } from "@/data/insurers";
import { patientsById } from "@/data/patients";
import { formatDay, formatTime } from "@/lib/dates";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import { useInsurance, type Claim, type ClaimStatus } from "@/store/insurance";
import { useOrders } from "@/store/orders";
import { DataTable, type ColumnDef } from "@/components/dashboard/data-table";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { InsurerLogo } from "@/components/marketing/insurer-logo";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, NativeSelect, Textarea } from "@/components/ui/form-controls";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryParam } from "@/components/dashboard/pharmacy/queue-list";

type View = "all" | "draft" | "submitted" | "in-review" | "decided";
const decided: ClaimStatus[] = ["approved", "partial", "denied"];

const views: { value: View; label: string; match: (s: ClaimStatus) => boolean }[] = [
  { value: "all", label: "All", match: () => true },
  { value: "draft", label: "Drafts", match: (s) => s === "draft" },
  { value: "submitted", label: "Submitted", match: (s) => s === "submitted" },
  { value: "in-review", label: "In review", match: (s) => s === "in-review" },
  { value: "decided", label: "Decided", match: (s) => decided.includes(s) },
];

const sourceLabel: Record<Claim["source"], string> = { order: "Marketplace order", appointment: "Appointment", procedure: "Procedure / stay" };

export const claimImage = (s: ClaimStatus) =>
  s === "denied" ? "/images/dashboard/claim-denied.png" : s === "approved" || s === "partial" ? "/images/dashboard/claim-approved.png" : "/images/dashboard/claim-pending.png";

const lastUpdate = (c: Claim) => c.decidedAt ?? c.submittedAt ?? c.createdAt;

/** Billing: every insurance claim, with submit and decision actions. */
export function ClaimsScreen() {
  const claims = useInsurance((s) => s.claims);
  const submitClaim = useInsurance((s) => s.submitClaim);
  const [view, setView] = useState<View>("all");
  const [insurer, setInsurer] = useState("all");
  const [openId, setOpenId] = useState<string | undefined>(() => queryParam("id"));

  const counts = useMemo(() => Object.fromEntries(views.map((v) => [v.value, claims.filter((c) => v.match(c.status)).length])) as Record<View, number>, [claims]);
  const rows = useMemo(
    () =>
      claims
        .filter((c) => views.find((v) => v.value === view)!.match(c.status) && (insurer === "all" || c.insurerId === insurer))
        .sort((a, b) => lastUpdate(b).localeCompare(lastUpdate(a))),
    [claims, view, insurer],
  );
  const drafts = claims.filter((c) => c.status === "draft");
  const open = claims.find((c) => c.id === openId);

  const totals = useMemo(() => {
    const billed = rows.reduce((s, c) => s + c.amount, 0);
    const expected = rows.reduce((s, c) => s + (c.status === "denied" ? 0 : c.insurerPays), 0);
    return { billed, expected, patient: billed - expected };
  }, [rows]);

  function submitAll() {
    drafts.forEach((c) => submitClaim(c.id));
    toast.success(`${drafts.length} claim${drafts.length > 1 ? "s" : ""} sent to insurers`, {
      description: `${formatPrice(drafts.reduce((s, c) => s + c.amount, 0))} billed in total.`,
    });
  }

  const columns = useMemo<ColumnDef<Claim, unknown>[]>(
    () => [
      { accessorKey: "id", header: "Claim", cell: ({ getValue }) => <span className="whitespace-nowrap font-mono text-xs font-bold">{getValue() as string}</span> },
      {
        id: "patient",
        accessorFn: (c) => patientsById[c.patientId]?.name ?? c.patientId,
        header: "Patient",
        cell: ({ row: { original: c }, getValue }) => (
          <div className="min-w-36">
            <p className="font-semibold">{getValue() as string}</p>
            <p className="truncate text-xs text-muted-foreground md:hidden">{c.title}</p>
          </div>
        ),
      },
      {
        id: "insurer",
        accessorFn: (c) => insurersById[c.insurerId]?.name ?? c.insurerId,
        header: "Insurer",
        meta: { className: "hidden sm:table-cell" },
        cell: ({ row: { original: c }, getValue }) => {
          const ins = insurersById[c.insurerId];
          return ins ? (
            <span className="flex items-center gap-2 whitespace-nowrap">
              <InsurerLogo insurer={ins} compact className="[&>span]:size-7 [&>span]:text-[10px]" />
              <span className="hidden xl:inline">{ins.name}</span>
            </span>
          ) : (
            (getValue() as string)
          );
        },
      },
      { accessorKey: "title", header: "For", meta: { className: "hidden md:table-cell" }, cell: ({ getValue }) => <span className="line-clamp-2 min-w-40">{getValue() as string}</span> },
      { accessorKey: "source", header: "Source", meta: { className: "hidden 2xl:table-cell" }, cell: ({ getValue }) => sourceLabel[getValue() as Claim["source"]] },
      { accessorKey: "amount", header: "Amount", meta: { className: "tabular-nums text-right" }, cell: ({ getValue }) => formatPrice(getValue() as number) },
      {
        accessorKey: "insurerPays",
        header: "Insurer pays",
        meta: { className: "hidden lg:table-cell tabular-nums text-right" },
        cell: ({ row: { original: c } }) => <span className={cn(c.status === "denied" && "text-muted-foreground line-through")}>{formatPrice(c.insurerPays)}</span>,
      },
      { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue() as string} /> },
      {
        id: "updated",
        accessorFn: lastUpdate,
        header: "Updated",
        meta: { className: "hidden lg:table-cell whitespace-nowrap" },
        cell: ({ row: { original: c } }) => (
          <div className="text-xs">
            <p>{formatDate(lastUpdate(c))}</p>
            <p className="text-muted-foreground">Created {formatDate(c.createdAt)}</p>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Insurance"
        title="Claims"
        description="Send claims to insurers, track them and record each decision. Patients see the result on their insurance page."
        actions={
          <Button onClick={submitAll} disabled={drafts.length === 0}>
            <Send aria-hidden /> Submit all drafts{drafts.length > 0 && ` (${drafts.length})`}
          </Button>
        }
      />

      <Tabs value={view} onValueChange={(v) => setView(v as View)}>
        <TabsList aria-label="Claim status">
          {views.map((v) => (
            <TabsTrigger key={v.value} value={v.value}>
              {v.label} <span className="rounded-full bg-background px-1.5 text-xs tabular-nums">{counts[v.value]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <dl className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Billed", value: totals.billed, tone: "text-foreground" },
          { label: "Expected from insurers", value: totals.expected, tone: "text-brand-700 dark:text-brand-300" },
          { label: "Patient share", value: totals.patient, tone: "text-coral-700 dark:text-orange-300" },
        ].map((t) => (
          <div key={t.label} className="rounded-2xl border border-border bg-surface px-5 py-4 shadow-soft">
            <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t.label}</dt>
            <dd className={cn("mt-1 font-display text-2xl font-extrabold tabular-nums", t.tone)}>{formatPrice(Math.round(t.value))}</dd>
          </div>
        ))}
      </dl>

      <DataTable
        columns={columns}
        data={rows}
        searchPlaceholder="Search claims"
        onRowClick={(c) => setOpenId(c.id)}
        empty={{ title: "No claims here", description: "Try another status or insurer.", image: "/images/dashboard/empty-claims.png" }}
        toolbar={
          <div className="flex items-center gap-2">
            <Label htmlFor="claims-insurer" className="sr-only">
              Insurer
            </Label>
            <NativeSelect id="claims-insurer" value={insurer} onChange={(e) => setInsurer(e.target.value)} className="h-10 w-52 rounded-full">
              <option value="all">All insurers</option>
              {insurers.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </NativeSelect>
          </div>
        }
      />

      <Sheet open={!!open} onOpenChange={(v) => !v && setOpenId(undefined)}>
        <SheetContent className="w-full max-w-lg">{open && <ClaimDetail key={open.id + open.status} claim={open} />}</SheetContent>
      </Sheet>
    </div>
  );
}

function claimLines(claim: Claim, orderLines?: { name: string; price: number; quantity: number }[]) {
  if (orderLines?.length) return orderLines.map((l) => ({ label: `${l.name}${l.quantity > 1 ? ` × ${l.quantity}` : ""}`, amount: l.price * l.quantity }));
  const split: [string, number][] =
    claim.source === "procedure"
      ? [
          ["Procedure and specialist fees", 0.55],
          ["Hospital stay and nursing", 0.3],
          ["Medicines and supplies", 0.15],
        ]
      : [
          ["Consultation", 0.7],
          ["Tests and supplies", 0.3],
        ];
  let used = 0;
  return split.map(([label, share], i) => {
    const amount = i === split.length - 1 ? Math.round((claim.amount - used) * 100) / 100 : Math.round(claim.amount * share * 100) / 100;
    used += amount;
    return { label, amount };
  });
}

function ClaimDetail({ claim }: { claim: Claim }) {
  const submitClaim = useInsurance((s) => s.submitClaim);
  const decideClaim = useInsurance((s) => s.decideClaim);
  const order = useOrders((s) => (claim.source === "order" ? s.orders.find((o) => o.id === claim.refId) : undefined));
  const insurer = insurersById[claim.insurerId];
  const patient = patientsById[claim.patientId];
  const lines = claimLines(claim, order?.lines);
  const isDecided = decided.includes(claim.status);

  const steps = [
    { label: "Created", at: claim.createdAt, done: true },
    { label: "Submitted to insurer", at: claim.submittedAt, done: claim.status !== "draft" },
    { label: "In review", done: claim.status === "in-review" || isDecided },
    {
      label: isDecided ? (claim.status === "approved" ? "Approved" : claim.status === "partial" ? "Partly approved" : "Denied") : "Decision",
      at: claim.decidedAt,
      done: isDecided,
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex items-center gap-4 border-b border-border bg-muted/40 p-6 pr-14">
        <Image src={claimImage(claim.status)} alt="" width={120} height={120} className="size-20 shrink-0" />
        <div className="min-w-0">
          <p className="font-mono text-xs font-bold text-primary">{claim.id}</p>
          <SheetTitle className="mt-0.5 text-lg font-extrabold leading-snug">{claim.title}</SheetTitle>
          <SheetDescription className="mt-1 text-sm text-muted-foreground">
            {patient?.name ?? claim.patientId} · {sourceLabel[claim.source]} {claim.refId}
          </SheetDescription>
          <StatusBadge status={claim.status} className="mt-2" />
        </div>
      </div>

      <div className="space-y-6 p-6">
        {insurer && (
          <div className="flex items-center justify-between gap-3">
            <InsurerLogo insurer={insurer} className="text-sm" />
            <span className="text-xs text-muted-foreground">{insurer.network === "in-network" ? "In network" : "Partly in network"}</span>
          </div>
        )}

        <section aria-labelledby="claim-timeline">
          <h3 id="claim-timeline" className="text-sm font-bold">
            Status
          </h3>
          <ol className="mt-3">
            {steps.map((s, i) => (
              <li key={s.label} className="relative flex gap-3 pb-4 last:pb-0">
                {i < steps.length - 1 && (
                  <span className={cn("absolute left-[11px] top-6 h-[calc(100%-1.25rem)] w-0.5", s.done && steps[i + 1].done ? "bg-brand-500" : "bg-border")} aria-hidden />
                )}
                <span
                  className={cn(
                    "relative z-10 grid size-6 shrink-0 place-items-center rounded-full border-2",
                    s.done
                      ? claim.status === "denied" && i === 3
                        ? "border-red-600 bg-red-600 text-white"
                        : "border-brand-600 bg-brand-600 text-white"
                      : "border-border bg-surface",
                  )}
                  aria-hidden
                >
                  {s.done && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                <div className="text-sm">
                  <p className={cn("font-semibold", !s.done && "text-muted-foreground")}>
                    {s.label}
                    <span className="sr-only">{s.done ? " (done)" : " (not yet)"}</span>
                  </p>
                  {s.at && s.done && (
                    <p className="text-xs text-muted-foreground">
                      {formatDay(s.at)}, {formatTime(s.at)}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="claim-lines">
          <h3 id="claim-lines" className="text-sm font-bold">
            Charges
          </h3>
          <ul className="mt-2 divide-y divide-border rounded-xl border border-border text-sm">
            {lines.map((l) => (
              <li key={l.label} className="flex justify-between gap-3 px-4 py-2.5">
                <span>{l.label}</span>
                <span className="tabular-nums">{formatPrice(l.amount)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Billed</dt>
              <dd className="font-semibold tabular-nums">{formatPrice(claim.amount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{isDecided ? "Insurer pays" : "Expected from insurer"}</dt>
              <dd className="font-semibold tabular-nums text-brand-700 dark:text-brand-300">{formatPrice(claim.insurerPays)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-1.5">
              <dt className="font-semibold">Patient share</dt>
              <dd className="font-bold tabular-nums">{formatPrice(Math.round((claim.amount - claim.insurerPays) * 100) / 100)}</dd>
            </div>
          </dl>
        </section>

        {claim.reason && (
          <p className="rounded-xl bg-muted p-3 text-sm">
            <span className="font-semibold">Insurer note: </span>
            {claim.reason}
          </p>
        )}

        {claim.status === "draft" && (
          <Button
            className="w-full"
            onClick={() => {
              submitClaim(claim.id);
              toast.success("Claim submitted", { description: `${claim.id} sent to ${insurer?.name ?? "the insurer"}.` });
            }}
          >
            <Send aria-hidden /> Submit to insurer
          </Button>
        )}
        {claim.status === "submitted" && (
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              decideClaim(claim.id, "in-review");
              toast("Claim marked in review", { description: `${insurer?.name ?? "The insurer"} is looking at ${claim.id}.` });
            }}
          >
            <Eye aria-hidden /> Mark in review
          </Button>
        )}
        {claim.status === "in-review" && <DecisionForm claim={claim} />}
      </div>
    </div>
  );
}

type Outcome = "approved" | "partial" | "denied";

function DecisionForm({ claim }: { claim: Claim }) {
  const decideClaim = useInsurance((s) => s.decideClaim);
  const [outcome, setOutcome] = useState<Outcome>("approved");
  const [amount, setAmount] = useState(String(claim.insurerPays));
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<{ amount?: string; reason?: string }>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    let pays = 0;
    if (outcome !== "denied") {
      const max = outcome === "partial" ? claim.amount - 0.01 : claim.amount;
      const parsed = z
        .number({ error: "Enter an amount." })
        .min(outcome === "partial" ? 1 : 0, "Enter an amount above 0.")
        .max(max, outcome === "partial" ? "Partly approved must be less than the billed amount." : "Can't be more than the billed amount.")
        .safeParse(amount === "" ? NaN : Number(amount));
      if (parsed.success) pays = Math.round(parsed.data * 100) / 100;
      else next.amount = parsed.error.issues[0]?.message;
    }
    if (outcome !== "approved") {
      const parsed = z.string().trim().min(8, "Please add the insurer's reason.").safeParse(reason);
      if (!parsed.success) next.reason = parsed.error.issues[0]?.message;
    }
    setErrors(next);
    if (next.amount || next.reason) return;

    decideClaim(claim.id, outcome, { insurerPays: pays, reason: reason.trim() || undefined });
    const label = { approved: "approved", partial: "partly approved", denied: "denied" }[outcome];
    toast[outcome === "denied" ? "error" : "success"](`Claim ${label}`, {
      description: outcome === "denied" ? "The patient has been told." : `Insurer pays ${formatPrice(pays)}. The patient can see it now.`,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border p-4">
      <fieldset>
        <legend className="text-sm font-bold">Record insurer decision</legend>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(
            [
              { v: "approved", l: "Approved" },
              { v: "partial", l: "Partly" },
              { v: "denied", l: "Denied" },
            ] as const
          ).map((o) => (
            <label
              key={o.v}
              className={cn(
                "cursor-pointer rounded-xl border px-3 py-2 text-center text-sm font-semibold transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-500/20",
                outcome === o.v
                  ? o.v === "denied"
                    ? "border-red-500 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200"
                    : "border-brand-500 bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200"
                  : "border-border hover:border-brand-300",
              )}
            >
              <input
                type="radio"
                name="claim-outcome"
                value={o.v}
                checked={outcome === o.v}
                onChange={() => {
                  setOutcome(o.v);
                  setErrors({});
                  if (o.v === "approved") setAmount(String(claim.insurerPays));
                }}
                className="sr-only"
              />
              {o.l}
            </label>
          ))}
        </div>
      </fieldset>

      {outcome !== "denied" && (
        <div className="space-y-1.5">
          <Label htmlFor="claim-pays">Insurer pays (USD)</Label>
          <Input
            id="claim-pays"
            type="number"
            inputMode="decimal"
            step="0.01"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-invalid={!!errors.amount}
          />
          <p className="text-xs text-muted-foreground">Billed {formatPrice(claim.amount)}</p>
          <FieldError message={errors.amount} />
        </div>
      )}
      {outcome !== "approved" && (
        <div className="space-y-1.5">
          <Label htmlFor="claim-reason">Reason from insurer</Label>
          <Textarea
            id="claim-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            aria-invalid={!!errors.reason}
            className="min-h-20"
            placeholder={outcome === "denied" ? "e.g. Not covered by this plan." : "e.g. Room upgrade not covered."}
          />
          <FieldError message={errors.reason} />
        </div>
      )}
      <Button type="submit" variant={outcome === "denied" ? "danger" : "primary"} className="w-full">
        Save decision
      </Button>
    </form>
  );
}
