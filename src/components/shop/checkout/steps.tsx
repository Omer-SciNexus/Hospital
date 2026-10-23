"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Camera,
  CreditCard,
  FileCheck2,
  Hospital,
  Info,
  Loader2,
  Lock,
  Plus,
  ShieldCheck,
  ShieldOff,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { insurers, insurersById, type Insurer } from "@/data/insurers";
import { DEMO_PATIENT_ID } from "@/data/patients";
import { cn, formatPrice } from "@/lib/utils";
import { useInsurance, type InsuranceCard } from "@/store/insurance";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, NativeSelect, Textarea } from "@/components/ui/form-controls";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { InsurerLogo } from "@/components/marketing/insurer-logo";
import { SlotPicker } from "./slot-picker";
import type { computeTotals } from "./totals";

type Totals = ReturnType<typeof computeTotals>;

export interface ContactData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zip: string;
  notes?: string;
  homeSlot?: string;
  videoSlot?: string;
}
export type InsuranceChoice = { mode: "card"; cardId: string } | { mode: "self" } | { mode: "new" };
export interface RxData {
  mode: "upload" | "doctor";
  fileName?: string;
}
export interface PaymentData {
  method: "card" | "cash" | "insurance-only";
  last4?: string;
}

export function StepCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-surface p-5 shadow-soft sm:p-8">
      <h2 className="text-xl font-extrabold sm:text-2xl">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Nav({ onBack, next = "Continue", disabled, type = "submit", onNext }: { onBack?: () => void; next?: string; disabled?: boolean; type?: "submit" | "button"; onNext?: () => void }) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-between">
      {onBack ? (
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft aria-hidden /> Back
        </Button>
      ) : (
        <span />
      )}
      <Button type={type} size="lg" disabled={disabled} onClick={onNext}>
        {next} <ArrowRight aria-hidden />
      </Button>
    </div>
  );
}

function Choice({
  checked,
  onSelect,
  disabled,
  children,
  name,
}: {
  checked: boolean;
  onSelect: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  name: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-500/20",
        checked ? "border-primary bg-brand-50/60 dark:bg-brand-950/60" : "border-border hover:border-brand-400",
        disabled && "cursor-not-allowed opacity-60 hover:border-border",
      )}
    >
      <input type="radio" name={name} checked={checked} onChange={onSelect} disabled={disabled} className="mt-1 size-4 shrink-0 accent-[var(--primary)]" />
      <span className="min-w-0 flex-1">{children}</span>
    </label>
  );
}

/* ───────────────────────── 1. Contact & delivery ───────────────────────── */

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name"),
  email: z.email("Please enter a valid email"),
  phone: z.string().trim().regex(/^[+()\d\s-]{7,20}$/, "Please enter a valid phone number"),
  address: z.string().trim().min(5, "Please enter your street address"),
  city: z.string().trim().min(2, "Please enter your city"),
  zip: z.string().trim().regex(/^[A-Za-z0-9 -]{3,10}$/, "Please enter a valid ZIP code"),
  notes: z.string().trim().max(200, "Please keep it under 200 characters").optional(),
  homeSlot: z.string().optional(),
  videoSlot: z.string().optional(),
});

export function ContactStep({
  defaults,
  needsHome,
  needsVideo,
  hasGoods,
  onNext,
}: {
  defaults: ContactData;
  needsHome: boolean;
  needsVideo: boolean;
  hasGoods: boolean;
  onNext: (data: ContactData) => void;
}) {
  const schema = contactSchema.superRefine((v, ctx) => {
    if (needsHome && !v.homeSlot) ctx.addIssue({ code: "custom", path: ["homeSlot"], message: "Please pick a collection slot" });
    if (needsVideo && !v.videoSlot) ctx.addIssue({ code: "custom", path: ["videoSlot"], message: "Please pick a video visit time" });
  });
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactData>({ resolver: zodResolver(schema), defaultValues: defaults });

  const field = (id: keyof ContactData, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, className?: string) => (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={`co-${id}`}>{label}</Label>
      <Input id={`co-${id}`} aria-invalid={!!errors[id]} {...props} {...register(id)} />
      <FieldError message={errors[id]?.message} />
    </div>
  );

  return (
    <StepCard
      title="Contact & delivery"
      description={hasGoods ? "Where should we deliver your order?" : "Where should our nurse come, and how can we reach you?"}
    >
      <form onSubmit={handleSubmit(onNext)} noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          {field("name", "Full name", { autoComplete: "name" })}
          {field("email", "Email", { type: "email", autoComplete: "email" })}
          {field("phone", "Phone", { type: "tel", autoComplete: "tel" })}
          {field("address", hasGoods ? "Delivery address" : "Home address", { autoComplete: "street-address" }, "sm:col-span-2")}
          {field("city", "City", { autoComplete: "address-level2" })}
          {field("zip", "ZIP code", { autoComplete: "postal-code", inputMode: "numeric" })}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="co-notes">Notes for the driver or nurse (optional)</Label>
            <Textarea id="co-notes" className="min-h-20" placeholder="Gate code, floor, best time to call…" aria-invalid={!!errors.notes} {...register("notes")} />
            <FieldError message={errors.notes?.message} />
          </div>
        </div>

        {(needsHome || needsVideo) && (
          <div className="mt-6 space-y-4">
            {needsHome && (
              <Controller
                control={control}
                name="homeSlot"
                render={({ field: f }) => (
                  <div className="space-y-2">
                    <SlotPicker kind="home" value={f.value} onChange={f.onChange} invalid={!!errors.homeSlot} />
                    <FieldError message={errors.homeSlot?.message} />
                  </div>
                )}
              />
            )}
            {needsVideo && (
              <Controller
                control={control}
                name="videoSlot"
                render={({ field: f }) => (
                  <div className="space-y-2">
                    <SlotPicker kind="video" value={f.value} onChange={f.onChange} invalid={!!errors.videoSlot} />
                    <FieldError message={errors.videoSlot?.message} />
                  </div>
                )}
              />
            )}
          </div>
        )}
        <Nav next="Continue to insurance" />
      </form>
    </StepCard>
  );
}

/* ───────────────────────── 2. Insurance ───────────────────────── */

const cardSchema = z.object({
  insurerId: z.string().min(1, "Choose your insurer"),
  plan: z.string().min(1, "Choose your plan"),
  memberId: z.string().trim().regex(/^[A-Za-z0-9-]{5,20}$/, "Use the member ID printed on your card (5–20 letters or numbers)"),
  groupNumber: z.string().trim().min(3, "Please enter the group number"),
  holder: z.string().trim().min(2, "Please enter the card holder's name"),
});
type CardValues = z.infer<typeof cardSchema>;

function NewCardForm({ holder, onAdded, onCancel }: { holder: string; onAdded: (cardId: string) => void; onCancel?: () => void }) {
  const addCard = useInsurance((s) => s.addCard);
  const [photo, setPhoto] = useState<string>();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CardValues>({ resolver: zodResolver(cardSchema), defaultValues: { insurerId: "", plan: "", memberId: "", groupNumber: "", holder } });
  const plans = insurersById[watch("insurerId")]?.plans ?? [];

  function submit(v: CardValues) {
    const id = addCard({ patientId: DEMO_PATIENT_ID, ...v, photo, primary: true });
    toast.success("Card added", { description: "Billing will check it. We use it as an estimate until then." });
    onAdded(id);
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      {/* Not a nested <form>: the step itself has no form element. */}
      <div className="mt-3 rounded-2xl border border-border bg-surface-2/50 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nc-insurer">Insurer</Label>
            <NativeSelect id="nc-insurer" aria-invalid={!!errors.insurerId} {...register("insurerId")}>
              <option value="">Choose…</option>
              {insurers.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </NativeSelect>
            <FieldError message={errors.insurerId?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nc-plan">Plan</Label>
            <NativeSelect id="nc-plan" aria-invalid={!!errors.plan} disabled={!plans.length} {...register("plan")}>
              <option value="">{plans.length ? "Choose…" : "Pick an insurer first"}</option>
              {plans.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </NativeSelect>
            <FieldError message={errors.plan?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nc-member">Member ID</Label>
            <Input id="nc-member" placeholder="NWH-1234-5678" aria-invalid={!!errors.memberId} {...register("memberId")} />
            <FieldError message={errors.memberId?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nc-group">Group number</Label>
            <Input id="nc-group" placeholder="GRP-22018" aria-invalid={!!errors.groupNumber} {...register("groupNumber")} />
            <FieldError message={errors.groupNumber?.message} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="nc-holder">Card holder</Label>
            <Input id="nc-holder" autoComplete="name" aria-invalid={!!errors.holder} {...register("holder")} />
            <FieldError message={errors.holder?.message} />
          </div>
        </div>
        <label className="mt-4 flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-border bg-surface p-4 transition-colors hover:border-brand-400 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-500/20">
          <Image src="/images/dashboard/upload-insurance-card.png" alt="" width={64} height={64} className="size-14 shrink-0" />
          <span className="min-w-0 flex-1 text-sm">
            <span className="flex items-center gap-1.5 font-semibold">
              <Camera className="size-4" aria-hidden /> {photo ? "Card photo added" : "Add a photo of your card (optional)"}
            </span>
            <span className="block truncate text-muted-foreground">{photo ?? "Front side, JPG, PNG or PDF. Helps billing verify faster."}</span>
          </span>
          <input type="file" accept="image/*,.pdf" className="sr-only" onChange={(e) => setPhoto(e.target.files?.[0]?.name)} />
        </label>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="button" onClick={handleSubmit(submit)}>
            <Plus aria-hidden /> Save card
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function InsuranceStep({
  cards,
  choice,
  setChoice,
  totals,
  insurer,
  holder,
  onBack,
  onNext,
}: {
  cards: InsuranceCard[];
  choice: InsuranceChoice;
  setChoice: (c: InsuranceChoice) => void;
  totals: Totals;
  insurer?: Insurer | null;
  holder: string;
  onBack: () => void;
  onNext: () => void;
}) {
  const selectedCard = choice.mode === "card" ? cards.find((c) => c.id === choice.cardId) : undefined;
  const canContinue = choice.mode === "self" || (!!selectedCard && selectedCard.status !== "rejected");

  return (
    <StepCard title="Insurance" description="Use your plan and only pay your share. We send the claim for you.">
      <div role="radiogroup" aria-label="How do you want to pay?" className="space-y-3">
        {cards.map((c) => {
          const ins = insurersById[c.insurerId];
          return (
            <Choice key={c.id} name="ins" checked={choice.mode === "card" && choice.cardId === c.id} disabled={c.status === "rejected"} onSelect={() => setChoice({ mode: "card", cardId: c.id })}>
              <span className="flex flex-wrap items-center justify-between gap-2">
                {ins && <InsurerLogo insurer={ins} className="text-sm" />}
                <StatusBadge status={c.status} />
              </span>
              <span className="mt-1.5 block text-xs text-muted-foreground">
                {c.plan} · Member {c.memberId.replace(/.(?=.{4})/g, "•")} · {c.holder}
                {c.primary && " · Primary"}
              </span>
              {c.status === "pending" && (
                <span className="mt-2 flex items-start gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                  <Info className="mt-px size-3.5 shrink-0" aria-hidden /> Estimate only: billing will confirm your card before the claim is paid.
                </span>
              )}
              {c.status === "rejected" && (
                <span className="mt-2 block text-xs font-medium text-red-700 dark:text-red-300">{c.note ?? "This card was not accepted. Please add it again."}</span>
              )}
            </Choice>
          );
        })}

        <Choice name="ins" checked={choice.mode === "new"} onSelect={() => setChoice({ mode: "new" })}>
          <span className="flex items-center gap-3">
            <Image src="/images/icons/insurance/card.png" alt="" width={36} height={36} className="size-9" />
            <span>
              <span className="block font-semibold">Add a new insurance card</span>
              <span className="block text-xs text-muted-foreground">Takes a minute. Billing checks it, usually the same day.</span>
            </span>
          </span>
        </Choice>
        <AnimatePresence initial={false}>
          {choice.mode === "new" && (
            <NewCardForm key="new" holder={holder} onAdded={(id) => setChoice({ mode: "card", cardId: id })} onCancel={cards.length ? () => setChoice({ mode: "self" }) : undefined} />
          )}
        </AnimatePresence>

        <Choice name="ins" checked={choice.mode === "self"} onSelect={() => setChoice({ mode: "self" })}>
          <span className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-muted">
              <ShieldOff className="size-4.5 text-muted-foreground" aria-hidden />
            </span>
            <span>
              <span className="block font-semibold">Pay myself</span>
              <span className="block text-xs text-muted-foreground">No insurance for this order.</span>
            </span>
          </span>
        </Choice>
      </div>

      {insurer && (
        <motion.div layout className="mt-6 rounded-2xl border border-border p-4 sm:p-5" aria-live="polite">
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <ShieldCheck className="size-4 text-green-700 dark:text-green-400" aria-hidden /> What {insurer.name} pays
          </h3>
          <ul className="mt-3 divide-y divide-border text-sm">
            {totals.lines.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0 truncate">{l.name}</span>
                {l.share > 0 ? (
                  <span className="shrink-0 font-semibold text-green-700 dark:text-green-400">
                    Insurance pays {l.share}% · {formatPrice(l.insurerPart)}
                  </span>
                ) : (
                  <span className="shrink-0 text-muted-foreground">Not covered</span>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-green-50 p-3 dark:bg-green-950">
              <p className="text-xs text-green-800 dark:text-green-200">Insurance pays</p>
              <p className="font-display text-xl font-extrabold text-green-800 dark:text-green-200">{formatPrice(totals.insurancePays)}</p>
            </div>
            <div className="rounded-xl bg-surface-2 p-3">
              <p className="text-xs text-muted-foreground">You pay</p>
              <p className="font-display text-xl font-extrabold">{formatPrice(totals.total)}</p>
            </div>
          </div>
        </motion.div>
      )}

      <Nav type="button" onBack={onBack} onNext={onNext} disabled={!canContinue} next={choice.mode === "new" ? "Save the card first" : "Continue"} />
    </StepCard>
  );
}

/* ───────────────────────── 3. Prescription ───────────────────────── */

export function RxStep({ items, value, onChange, onBack, onNext }: { items: string[]; value: RxData; onChange: (v: RxData) => void; onBack: () => void; onNext: () => void }) {
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const ok = value.mode === "doctor" || !!value.fileName;
  const pick = (f?: File) => f && onChange({ mode: "upload", fileName: f.name });

  return (
    <StepCard title="Prescription" description={`Needed for: ${items.join(", ")}. A pharmacist checks it before we ship.`}>
      <div role="radiogroup" aria-label="Prescription" className="space-y-3">
        <Choice name="rx" checked={value.mode === "upload"} onSelect={() => onChange({ mode: "upload", fileName: value.fileName })}>
          <span className="font-semibold">Upload my prescription</span>
          <span className="block text-xs text-muted-foreground">A clear photo or PDF of the paper prescription.</span>
        </Choice>
        <AnimatePresence initial={false}>
          {value.mode === "upload" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  pick(e.dataTransfer.files?.[0]);
                }}
                className={cn(
                  "flex flex-col items-center rounded-2xl border-2 border-dashed p-6 text-center transition-colors",
                  drag ? "border-primary bg-brand-50 dark:bg-brand-950" : "border-border bg-surface-2/50",
                )}
              >
                <Image src="/images/dashboard/upload-rx.png" alt="" width={96} height={96} className="size-20" />
                {value.fileName ? (
                  <p className="mt-3 flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-sm font-semibold text-green-800 dark:bg-green-950 dark:text-green-200">
                    <FileCheck2 className="size-4" aria-hidden /> <span className="max-w-56 truncate">{value.fileName}</span>
                    <button type="button" aria-label="Remove file" onClick={() => onChange({ mode: "upload" })} className="rounded-full p-0.5 hover:bg-green-100 dark:hover:bg-green-900">
                      <X className="size-3.5" aria-hidden />
                    </button>
                  </p>
                ) : (
                  <p className="mt-3 text-sm font-semibold">Drag and drop your file here</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">JPG, PNG or PDF, up to 10 MB</p>
                <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => input.current?.click()}>
                  <Upload aria-hidden /> {value.fileName ? "Choose another file" : "Choose a file"}
                </Button>
                <input ref={input} type="file" accept="image/*,.pdf" className="sr-only" tabIndex={-1} aria-label="Prescription file" onChange={(e) => pick(e.target.files?.[0])} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <Choice name="rx" checked={value.mode === "doctor"} onSelect={() => onChange({ mode: "doctor" })}>
          <span className="flex items-center gap-2 font-semibold">
            <Hospital className="size-4 text-brand-700 dark:text-brand-300" aria-hidden /> My doctor at the hospital already sent it
          </span>
          <span className="block text-xs text-muted-foreground">We find the e-prescription in your hospital record.</span>
        </Choice>
      </div>
      <Nav type="button" onBack={onBack} onNext={onNext} disabled={!ok} />
    </StepCard>
  );
}

/* ───────────────────────── 4. Payment ───────────────────────── */

const cardPaySchema = z.object({
  holder: z.string().trim().min(2, "Name as it appears on the card"),
  number: z.string().transform((v) => v.replace(/\s/g, "")).pipe(z.string().regex(/^\d{16}$/, "Card number must be 16 digits")),
  expiry: z
    .string()
    .trim()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Use MM/YY")
    .refine((v) => {
      const [m, y] = v.split("/").map(Number);
      return new Date(2000 + y, m) > new Date();
    }, "This card has expired"),
  cvc: z.string().trim().regex(/^\d{3,4}$/, "3 or 4 digits"),
});
type CardPayIn = z.input<typeof cardPaySchema>;
type CardPayOut = z.output<typeof cardPaySchema>;

export function PaymentStep({ total, holder, value, onBack, onNext }: { total: number; holder: string; value?: PaymentData; onBack: () => void; onNext: (p: PaymentData) => void }) {
  const [method, setMethod] = useState<"card" | "cash">(value?.method === "cash" ? "cash" : "card");
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CardPayIn, unknown, CardPayOut>({ resolver: zodResolver(cardPaySchema), defaultValues: { holder, number: "", expiry: "", cvc: "" } });

  if (total <= 0) {
    return (
      <StepCard title="Payment" description="Nothing to pay today.">
        <p className="flex items-center gap-3 rounded-2xl bg-green-50 p-4 text-sm font-medium text-green-800 dark:bg-green-950 dark:text-green-200">
          <ShieldCheck className="size-5 shrink-0" aria-hidden /> Your insurance covers the full amount.
        </p>
        <Nav type="button" onBack={onBack} onNext={() => onNext({ method: "insurance-only" })} />
      </StepCard>
    );
  }

  const submit = method === "cash" ? () => onNext({ method: "cash" }) : handleSubmit((v) => onNext({ method: "card", last4: v.number.slice(-4) }));

  return (
    <StepCard title="Payment" description={`You pay ${formatPrice(total)} today. This is a demo: no real card is charged.`}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div role="radiogroup" aria-label="Payment method" className="grid gap-3 sm:grid-cols-2">
          <Choice name="pay" checked={method === "card"} onSelect={() => setMethod("card")}>
            <span className="flex items-center gap-2 font-semibold">
              <CreditCard className="size-4" aria-hidden /> Card
            </span>
            <span className="block text-xs text-muted-foreground">Debit, credit or health savings card</span>
          </Choice>
          <Choice name="pay" checked={method === "cash"} onSelect={() => setMethod("cash")}>
            <span className="flex items-center gap-2 font-semibold">
              <Banknote className="size-4" aria-hidden /> Pay on delivery
            </span>
            <span className="block text-xs text-muted-foreground">Cash or card to the driver or nurse</span>
          </Choice>
        </div>

        <AnimatePresence initial={false} mode="wait">
          {method === "card" ? (
            <motion.div key="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-5 grid gap-4 sm:grid-cols-4">
              <div className="space-y-2 sm:col-span-4">
                <Label htmlFor="pay-holder">Name on card</Label>
                <Input id="pay-holder" autoComplete="cc-name" aria-invalid={!!errors.holder} {...register("holder")} />
                <FieldError message={errors.holder?.message} />
              </div>
              <div className="space-y-2 sm:col-span-4">
                <Label htmlFor="pay-number">Card number</Label>
                <div className="relative">
                  <Input
                    id="pay-number"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="4242 4242 4242 4242"
                    className="pr-10 tabular-nums"
                    aria-invalid={!!errors.number}
                    {...register("number", {
                      onChange: (e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
                        setValue("number", digits.replace(/(.{4})(?=.)/g, "$1 "));
                      },
                    })}
                  />
                  <Lock className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                </div>
                <FieldError message={errors.number?.message} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="pay-exp">Expiry</Label>
                <Input
                  id="pay-exp"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  placeholder="MM/YY"
                  aria-invalid={!!errors.expiry}
                  {...register("expiry", {
                    onChange: (e) => {
                      const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setValue("expiry", d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
                    },
                  })}
                />
                <FieldError message={errors.expiry?.message} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="pay-cvc">Security code</Label>
                <Input id="pay-cvc" inputMode="numeric" autoComplete="cc-csc" placeholder="123" maxLength={4} aria-invalid={!!errors.cvc} {...register("cvc")} />
                <FieldError message={errors.cvc?.message} />
              </div>
            </motion.div>
          ) : (
            <motion.p key="cash" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-5 rounded-2xl bg-surface-2 p-4 text-sm text-muted-foreground">
              Please have <span className="font-semibold text-foreground">{formatPrice(total)}</span> ready. Our driver or nurse carries a card reader.
            </motion.p>
          )}
        </AnimatePresence>
        <Nav onBack={onBack} next="Review order" />
      </form>
    </StepCard>
  );
}

/* ───────────────────────── 5. Review ───────────────────────── */

export function ReviewStep({
  contact,
  insurer,
  cardStatus,
  rx,
  payment,
  totals,
  placing,
  onEdit,
  onBack,
  onPlace,
}: {
  contact: ContactData;
  insurer?: Insurer | null;
  cardStatus?: string;
  rx?: RxData;
  payment: PaymentData;
  totals: Totals;
  placing: boolean;
  onEdit: (step: string) => void;
  onBack: () => void;
  onPlace: () => void;
}) {
  const block = (title: string, step: string, body: React.ReactNode) => (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold">{title}</h3>
        <button type="button" onClick={() => onEdit(step)} className="text-xs font-bold text-primary hover:underline" aria-label={`Edit ${title.toLowerCase()}`}>
          Edit
        </button>
      </div>
      <div className="mt-1.5 text-sm text-muted-foreground">{body}</div>
    </div>
  );
  const payLabel =
    payment.method === "card" ? `Card ending ${payment.last4}` : payment.method === "cash" ? "Pay on delivery" : "Insurance covers it all";

  return (
    <StepCard title="Review & place order" description="Check everything once more. You can still edit any step.">
      <div className="grid gap-3 sm:grid-cols-2">
        {block(
          "Contact & delivery",
          "contact",
          <>
            <p className="text-foreground">{contact.name}</p>
            <p>{contact.email} · {contact.phone}</p>
            <p>{contact.address}, {contact.city} {contact.zip}</p>
            {contact.homeSlot && <p className="mt-1 font-medium text-foreground">Home collection: {contact.homeSlot}</p>}
            {contact.videoSlot && <p className="mt-1 font-medium text-foreground">Video visit: {contact.videoSlot}</p>}
          </>,
        )}
        {block(
          "Insurance",
          "insurance",
          insurer ? (
            <>
              <p className="text-foreground">{insurer.name}</p>
              <p>Pays {formatPrice(totals.insurancePays)} of {formatPrice(totals.subtotal)}</p>
              {cardStatus === "pending" && <p className="text-amber-700 dark:text-amber-400">Estimate only, billing will confirm</p>}
            </>
          ) : (
            <p>Paying myself</p>
          ),
        )}
        {rx && block("Prescription", "rx", <p>{rx.mode === "doctor" ? "Sent by my hospital doctor" : rx.fileName}</p>)}
        {block("Payment", "payment", <p>{payLabel} · {formatPrice(totals.total)}</p>)}
      </div>
      <p className="mt-5 text-xs text-muted-foreground">
        By placing the order you agree to our terms. Prescription items ship only after a pharmacist approves the prescription.
      </p>
      <div className="mt-6 flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-between">
        <Button type="button" variant="ghost" onClick={onBack} disabled={placing}>
          <ArrowLeft aria-hidden /> Back
        </Button>
        <Button type="button" size="lg" variant="accent" onClick={onPlace} disabled={placing}>
          {placing ? <Loader2 className="animate-spin" aria-hidden /> : <Lock aria-hidden />}
          {placing ? "Placing order…" : `Place order · ${formatPrice(totals.total)}`}
        </Button>
      </div>
    </StepCard>
  );
}
