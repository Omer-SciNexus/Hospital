"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CalendarCheck, Plus, Star, Trash2, TriangleAlert } from "lucide-react";
import { getDepartment } from "@/config/departments";
import { doctors, doctorsById } from "@/data/doctors";
import { insurers, insurersById } from "@/data/insurers";
import { DEMO_PATIENT_ID } from "@/data/patients";
import { useInsurance, type Claim, type InsuranceCard } from "@/store/insurance";
import { coverageFor } from "@/lib/insurance";
import { formatDate, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { FieldError, Input, Label, NativeSelect } from "@/components/ui/form-controls";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader, Panel } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { InsurerLogo } from "@/components/marketing/insurer-logo";
import { InsuranceCardVisual } from "./insurance-card-visual";
import { UploadDropzone } from "./upload-dropzone";
import { useDisplayName, useMyInsurance } from "./use-patient";

/** Patient insurance: cards (billing verifies them), coverage, claims and pre-approvals. */
export function InsuranceScreen() {
  const { cards, primary, claims, preapprovals } = useMyInsurance();
  const setPrimary = useInsurance((s) => s.setPrimary);
  const removeCard = useInsurance((s) => s.removeCard);
  const [addOpen, setAddOpen] = useState(false);
  // The dashboard renders only in the browser, so the hash is readable on first render.
  const [tab, setTab] = useState(() => (window.location.hash === "#preapprovals" ? "preapprovals" : "claims"));
  const [paOpen, setPaOpen] = useState(false);
  const [removing, setRemoving] = useState<InsuranceCard | null>(null);
  const [claim, setClaim] = useState<Claim | null>(null);

  return (
    <div>
      <PageHeader
        eyebrow="Billing"
        title="Insurance"
        description="Add your cards, see what your plan pays and follow your claims. Our billing team checks every new card."
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus aria-hidden /> Add insurance card
          </Button>
        }
      />

      {cards.length === 0 ? (
        <Panel>
          <EmptyState
            image="/images/dashboard/empty-insurance.png"
            title="No insurance cards yet"
            description="Add your card and we will show your share at booking and checkout."
            action={
              <Button onClick={() => setAddOpen(true)}>
                <Plus aria-hidden /> Add insurance card
              </Button>
            }
          />
        </Panel>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((c) => (
            <li key={c.id} className="space-y-3">
              <InsuranceCardVisual card={c} />
              {c.status === "rejected" && (
                <p className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {c.note ?? "Billing could not verify this card."}
                </p>
              )}
              {c.status === "pending" && (
                <p className="rounded-xl bg-coral-50 p-3 text-sm text-coral-700 dark:bg-orange-950 dark:text-orange-100">
                  Billing is checking this card. This usually takes 1 working day.
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {!c.primary && (
                  <Button
                    size="sm"
                    variant="soft"
                    onClick={() => {
                      setPrimary(c.id);
                      toast.success("Primary card changed", { description: `${insurersById[c.insurerId]?.name} is now used first.` });
                    }}
                  >
                    <Star aria-hidden /> Set as primary
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950" onClick={() => setRemoving(c)}>
                  <Trash2 aria-hidden /> Remove
                </Button>
                <span className="ml-auto text-xs text-muted-foreground">Added {formatDate(c.addedAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {primary && <CoverageSummary card={primary} />}

      <div className="mt-8">
        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList aria-label="Claims and pre-approvals">
              <TabsTrigger value="claims">Claims ({claims.length})</TabsTrigger>
              <TabsTrigger value="preapprovals">Pre-approvals ({preapprovals.length})</TabsTrigger>
            </TabsList>
            <Button variant="outline" onClick={() => setPaOpen(true)} disabled={!primary}>
              <CalendarCheck aria-hidden /> Request pre-approval
            </Button>
          </div>

          <TabsContent value="claims">
            <Panel bodyClassName="p-0">
              {claims.length === 0 ? (
                <EmptyState image="/images/dashboard/empty-claims.png" title="No claims yet" description="When billing sends a claim to your insurer, you can follow it here." />
              ) : (
                <ul className="divide-y divide-border">
                  {claims.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => setClaim(c)}
                        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                      >
                        <Image src="/images/icons/insurance/claim.png" alt="" width={44} height={44} className="size-11 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{c.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.id} · {formatDate(c.createdAt)} · {formatPrice(c.amount)}
                          </p>
                        </div>
                        <div className="hidden text-right text-xs sm:block">
                          <p className="text-muted-foreground">Insurer pays</p>
                          <p className="font-semibold tabular-nums">{formatPrice(c.insurerPays)}</p>
                        </div>
                        <StatusBadge status={c.status} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </TabsContent>

          <TabsContent value="preapprovals">
            <Panel bodyClassName="p-0">
              {preapprovals.length === 0 ? (
                <EmptyState
                  image="/images/dashboard/preapproval.png"
                  title="No pre-approvals"
                  description="Some scans and procedures need your insurer's OK first. Request one here."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {preapprovals.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                      <Image src="/images/dashboard/preapproval.png" alt="" width={44} height={44} className="size-11 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{p.procedure}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.id} · {doctorsById[p.doctorId]?.name} · est. {formatPrice(p.estimatedCost)} · {formatDate(p.requestedAt)}
                        </p>
                        {p.note && <p className="mt-1 text-sm">{p.note}</p>}
                      </div>
                      <StatusBadge status={p.urgency} />
                      <StatusBadge status={p.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </TabsContent>
        </Tabs>
      </div>

      <AddCardDialog open={addOpen} onOpenChange={setAddOpen} />
      {primary && <PreapprovalDialog open={paOpen} onOpenChange={setPaOpen} insurerId={primary.insurerId} />}
      <ClaimDialog claim={claim} onClose={() => setClaim(null)} />

      <Dialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        {removing && (
          <DialogContent size="sm">
            <DialogTitle>Remove this card?</DialogTitle>
            <DialogDescription>
              {insurersById[removing.insurerId]?.name}, member ID {removing.memberId}. You can add it again later.
            </DialogDescription>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Keep card</Button>
              </DialogClose>
              <Button
                variant="danger"
                onClick={() => {
                  removeCard(removing.id);
                  toast.success("Card removed");
                  setRemoving(null);
                }}
              >
                <Trash2 aria-hidden /> Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function CoverageSummary({ card }: { card: InsuranceCard }) {
  const insurer = insurersById[card.insurerId];
  if (!insurer) return null;
  const rows = [
    { label: "Doctor visits (in network)", pct: insurer.network === "partial" ? Math.round(insurer.coverage * 0.85) : insurer.coverage },
    { label: "Lab tests and health checks", pct: coverageFor({ coverage: 80 }, insurer) },
    { label: "Prescription medicines", pct: coverageFor({ coverage: 90 }, insurer) },
    { label: "Medical devices", pct: coverageFor({ coverage: 50 }, insurer) },
    { label: "Vitamins and cosmetic care", pct: 0 },
  ];
  return (
    <Panel
      className="mt-8"
      title="What your plan covers"
      description={`Based on your primary card: ${insurer.name} ${card.plan}`}
      action={card.status !== "verified" ? <StatusBadge status={card.status} label="Not verified yet" /> : undefined}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="space-y-4">
          <InsurerLogo insurer={insurer} />
          <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-4">
            <Image src="/images/icons/insurance/in-network.png" alt="" width={48} height={48} className="size-12" />
            <div>
              <Badge variant={insurer.network === "in-network" ? "green" : "coral"}>
                {insurer.network === "in-network" ? "In network" : "Partly in network"}
              </Badge>
              <p className="mt-1 text-sm text-muted-foreground">
                {insurer.network === "in-network" ? `All ${insurer.name} plans work with our doctors.` : "Some of our doctors are outside your network."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-4">
            <Image src="/images/icons/insurance/coverage.png" alt="" width={48} height={48} className="size-12" />
            <div>
              <p className="font-display text-2xl font-extrabold">{insurer.coverage}%</p>
              <p className="text-sm text-muted-foreground">Typical share your plan pays for outpatient care</p>
            </div>
          </div>
        </div>
        <ul className="space-y-3 self-center">
          {rows.map((r) => (
            <li key={r.label}>
              <div className="flex justify-between text-sm">
                <span>{r.label}</span>
                <span className="font-semibold tabular-nums">{r.pct > 0 ? `${r.pct}% covered` : "Not covered"}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${r.pct}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

const cardSchema = z.object({
  insurerId: z.string().min(1, "Choose your insurer"),
  plan: z.string().min(1, "Choose your plan"),
  memberId: z.string().trim().min(4, "Member ID is on the front of your card"),
  groupNumber: z.string().trim().min(3, "Group number is on the front of your card"),
  holder: z.string().trim().min(2, "Name of the main card holder"),
});
type CardValues = z.infer<typeof cardSchema>;

function AddCardDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const name = useDisplayName();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && <AddCardForm holder={name} onDone={() => onOpenChange(false)} />}
    </Dialog>
  );
}

function AddCardForm({ holder, onDone }: { holder: string; onDone: () => void }) {
  const addCard = useInsurance((s) => s.addCard);
  const [file, setFile] = useState<File | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CardValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: { insurerId: "", plan: "", memberId: "", groupNumber: "", holder },
  });
  const insurer = insurersById[watch("insurerId")];

  async function onSubmit(v: CardValues) {
    await new Promise((r) => setTimeout(r, 700));
    addCard({ patientId: DEMO_PATIENT_ID, ...v, photo: file?.name });
    toast.success("Sent to billing for checking", { description: "We will let you know when your card is verified." });
    onDone();
  }

  return (
    <DialogContent size="lg">
      <DialogTitle>Add insurance card</DialogTitle>
      <DialogDescription>Type the details from the front of your card. A photo helps billing check it faster.</DialogDescription>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="card-insurer">Insurer</Label>
            <NativeSelect id="card-insurer" aria-invalid={!!errors.insurerId} {...register("insurerId", { onChange: () => setValue("plan", "") })}>
              <option value="">Choose your insurer</option>
              {insurers.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </NativeSelect>
            <FieldError message={errors.insurerId?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="card-plan">Plan</Label>
            <NativeSelect id="card-plan" disabled={!insurer} aria-invalid={!!errors.plan} {...register("plan")}>
              <option value="">{insurer ? "Choose a plan" : "Choose an insurer first"}</option>
              {insurer?.plans.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </NativeSelect>
            <FieldError message={errors.plan?.message} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="card-member">Member ID</Label>
              <Input id="card-member" aria-invalid={!!errors.memberId} {...register("memberId")} />
              <FieldError message={errors.memberId?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-group">Group no.</Label>
              <Input id="card-group" aria-invalid={!!errors.groupNumber} {...register("groupNumber")} />
              <FieldError message={errors.groupNumber?.message} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="card-holder">Card holder</Label>
            <Input id="card-holder" aria-invalid={!!errors.holder} {...register("holder")} />
            <FieldError message={errors.holder?.message} />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold">
            Card photo <span className="font-normal text-muted-foreground">(recommended)</span>
          </p>
          <UploadDropzone image="/images/dashboard/upload-insurance-card.png" label="Front of your card" hint="JPG or PNG, both sides if you can" accept=".jpg,.jpeg,.png,.pdf" file={file} onFile={setFile} />
        </div>
        <DialogFooter className="md:col-span-2">
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isSubmitting}>
            <Plus aria-hidden /> {isSubmitting ? "Sending…" : "Send to billing"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

const paSchema = z.object({
  procedure: z.string().trim().min(3, "What is the scan or procedure?"),
  doctorId: z.string().min(1, "Choose the doctor who asked for it"),
  estimatedCost: z.coerce.number<string>().min(1, "Enter the estimated cost").max(500000, "That looks too high"),
  urgency: z.enum(["routine", "urgent"]),
});
type PaInput = z.input<typeof paSchema>;
type PaValues = z.output<typeof paSchema>;

function PreapprovalDialog({ open, onOpenChange, insurerId }: { open: boolean; onOpenChange: (o: boolean) => void; insurerId: string }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && <PreapprovalForm insurerId={insurerId} onDone={() => onOpenChange(false)} />}
    </Dialog>
  );
}

function PreapprovalForm({ insurerId, onDone }: { insurerId: string; onDone: () => void }) {
  const request = useInsurance((s) => s.requestPreapproval);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PaInput, unknown, PaValues>({
    resolver: zodResolver(paSchema),
    defaultValues: { procedure: "", doctorId: "", estimatedCost: "", urgency: "routine" },
  });

  async function onSubmit(v: PaValues) {
    await new Promise((r) => setTimeout(r, 700));
    const doctor = doctorsById[v.doctorId];
    const id = request({ patientId: DEMO_PATIENT_ID, insurerId, procedure: v.procedure, doctorId: v.doctorId, department: doctor?.department ?? "", estimatedCost: v.estimatedCost, urgency: v.urgency });
    toast.success("Pre-approval requested", { description: `Ref ${id}. Billing will send it to ${insurersById[insurerId]?.name}.` });
    onDone();
  }

  return (
    <DialogContent>
      <DialogTitle>Request pre-approval</DialogTitle>
      <DialogDescription>Your insurer ({insurersById[insurerId]?.name}) must agree before some scans and procedures.</DialogDescription>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pa-procedure">Procedure or scan</Label>
          <Input id="pa-procedure" placeholder="e.g. Knee MRI" aria-invalid={!!errors.procedure} {...register("procedure")} />
          <FieldError message={errors.procedure?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pa-doctor">Doctor</Label>
          <NativeSelect id="pa-doctor" aria-invalid={!!errors.doctorId} {...register("doctorId")}>
            <option value="">Choose a doctor</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({getDepartment(d.department)?.name ?? d.department})
              </option>
            ))}
          </NativeSelect>
          <FieldError message={errors.doctorId?.message} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pa-cost">Estimated cost (USD)</Label>
            <Input id="pa-cost" type="number" inputMode="decimal" min={1} aria-invalid={!!errors.estimatedCost} {...register("estimatedCost")} />
            <FieldError message={errors.estimatedCost?.message} />
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">Urgency</legend>
            <div className="grid grid-cols-2 gap-2">
              {(["routine", "urgent"] as const).map((u) => (
                <label
                  key={u}
                  className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-border px-3 text-sm capitalize has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 dark:has-[:checked]:bg-brand-950"
                >
                  <input type="radio" value={u} className="accent-[var(--primary)]" {...register("urgency")} />
                  {u}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isSubmitting}>
            <CalendarCheck aria-hidden /> {isSubmitting ? "Sending…" : "Send request"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

const claimImage = (status: Claim["status"]) =>
  status === "approved" || status === "partial"
    ? "/images/dashboard/claim-approved.png"
    : status === "denied"
      ? "/images/dashboard/claim-denied.png"
      : "/images/dashboard/claim-pending.png";

function ClaimDialog({ claim, onClose }: { claim: Claim | null; onClose: () => void }) {
  return (
    <Dialog open={!!claim} onOpenChange={(o) => !o && onClose()}>
      {claim && (
        <DialogContent>
          <div className="text-center">
            <Image src={claimImage(claim.status)} alt="" width={160} height={160} className="mx-auto size-32" />
            <DialogTitle className="mt-2 pr-0">{claim.title}</DialogTitle>
            <DialogDescription>
              {claim.id} · {insurersById[claim.insurerId]?.name} · ref {claim.refId}
            </DialogDescription>
            <div className="mt-3">
              <StatusBadge status={claim.status} />
            </div>
          </div>
          <dl className="mt-6 grid grid-cols-3 gap-3 text-center text-sm">
            <div className="rounded-xl bg-surface-2 p-3">
              <dt className="text-xs text-muted-foreground">Amount</dt>
              <dd className="font-display text-lg font-bold tabular-nums">{formatPrice(claim.amount)}</dd>
            </div>
            <div className="rounded-xl bg-surface-2 p-3">
              <dt className="text-xs text-muted-foreground">Insurer pays</dt>
              <dd className="font-display text-lg font-bold tabular-nums text-green-700 dark:text-green-300">{formatPrice(claim.insurerPays)}</dd>
            </div>
            <div className="rounded-xl bg-surface-2 p-3">
              <dt className="text-xs text-muted-foreground">You pay</dt>
              <dd className="font-display text-lg font-bold tabular-nums">{formatPrice(Math.max(0, claim.amount - claim.insurerPays))}</dd>
            </div>
          </dl>
          <p className="mt-4 rounded-xl border border-border p-3 text-sm">
            {claim.reason ??
              (claim.status === "approved"
                ? "Approved in full under your plan."
                : claim.status === "draft"
                  ? "Billing is preparing this claim."
                  : "Your insurer is reviewing this claim. This usually takes 5 to 10 working days.")}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Created {formatDate(claim.createdAt)}
            {claim.submittedAt && ` · sent ${formatDate(claim.submittedAt)}`}
            {claim.decidedAt && ` · decided ${formatDate(claim.decidedAt)}`}
          </p>
          <DialogFooter>
            {claim.status === "denied" && (
              <Button variant="outline" onClick={() => toast.success("Appeal started", { description: "Billing will contact you within 2 working days." })}>
                Ask billing to appeal
              </Button>
            )}
            <DialogClose asChild>
              <Button>Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
