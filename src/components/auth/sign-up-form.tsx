"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, LoaderCircle, ShieldCheck, Wallet } from "lucide-react";
import { departments } from "@/config/departments";
import { insurers, insurersById } from "@/data/insurers";
import { DEMO_PATIENT_ID } from "@/data/patients";
import { useSession } from "@/store/session";
import { useInsurance } from "@/store/insurance";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, NativeSelect } from "@/components/ui/form-controls";
import { PasswordInput } from "./password-input";
import { PasswordStrength } from "./password-strength";

const accountSchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your full name"),
    email: z.email("Please enter a valid email"),
    password: z.string().min(6, "Password needs at least 6 characters"),
    confirm: z.string().min(1, "Please type your password again"),
    terms: z.boolean().refine((v) => v, "Please accept the terms to continue"),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match" });

const sexes = ["Female", "Male", "Other", "Prefer not to say"] as const;
const languages = ["English", "Spanish", "French", "Arabic", "Chinese", "Hindi", "Portuguese", "German"] as const;

const aboutSchema = z.object({
  dob: z
    .string()
    .min(1, "Please enter your date of birth")
    .refine((v) => !Number.isNaN(Date.parse(v)) && new Date(v) < new Date(), "Date of birth must be in the past"),
  sex: z.enum(sexes, { message: "Please choose one" }),
  phone: z.string().trim().regex(/^[+()\d\s-]{7,20}$/, "Please enter a valid phone number"),
  language: z.enum(languages),
  department: z.string(),
});

const insuranceSchema = z
  .object({
    insurerId: z.string(),
    plan: z.string(),
    memberId: z.string().trim(),
    groupNumber: z.string().trim(),
  })
  .superRefine((v, ctx) => {
    if (!v.insurerId) {
      ctx.addIssue({ code: "custom", path: ["insurerId"], message: "Choose your insurer, or skip this step" });
      return;
    }
    if (!v.plan) ctx.addIssue({ code: "custom", path: ["plan"], message: "Choose your plan" });
    if (v.memberId.length < 4) ctx.addIssue({ code: "custom", path: ["memberId"], message: "Member ID is on the front of your card" });
  });

type Account = z.infer<typeof accountSchema>;
type About = z.infer<typeof aboutSchema>;
type Insurance = z.infer<typeof insuranceSchema>;

const steps = ["Account", "About you", "Insurance"] as const;

/** Three-step sign-up: account → about you → optional insurance. Signs in as the demo patient. */
export function SignUpForm() {
  const router = useRouter();
  const signIn = useSession((s) => s.signIn);
  const addCard = useInsurance((s) => s.addCard);
  const [step, setStep] = useState(0);
  const [account, setAccount] = useState<Account | null>(null);
  const [about, setAbout] = useState<About | null>(null);
  const [saving, setSaving] = useState(false);

  async function finish(insurance: Insurance | null) {
    if (!account) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    signIn("patient", { name: account.name, email: account.email });
    if (insurance) {
      addCard({
        patientId: DEMO_PATIENT_ID,
        insurerId: insurance.insurerId,
        plan: insurance.plan,
        memberId: insurance.memberId,
        groupNumber: insurance.groupNumber || "-",
        holder: account.name,
        primary: true,
      });
      toast.success("Account created", {
        description: `Our billing team will check your ${insurersById[insurance.insurerId]?.name ?? ""} card, usually within 1 working day.`,
      });
    } else {
      toast.success("Account created", { description: "Welcome! You can add insurance later from your dashboard." });
    }
    router.push("/dashboard");
  }

  return (
    <div className="mt-8">
      <ol className="grid grid-cols-3 gap-2" aria-label="Sign-up progress">
        {steps.map((label, i) => (
          <li key={label} aria-current={i === step ? "step" : undefined}>
            <span className={cn("block h-1.5 rounded-full transition-colors", i <= step ? "bg-primary" : "bg-muted")} />
            <span className={cn("mt-2 flex items-center gap-1.5 text-xs font-semibold", i === step ? "text-foreground" : "text-muted-foreground")}>
              <span
                className={cn(
                  "grid size-5 place-items-center rounded-full text-[10px]",
                  i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-100" : "bg-muted",
                )}
              >
                {i < step ? <Check className="size-3" aria-hidden /> : i + 1}
              </span>
              {label}
            </span>
          </li>
        ))}
      </ol>
      <p className="sr-only" aria-live="polite">
        Step {step + 1} of {steps.length}: {steps[step]}
      </p>

      <div className="mt-8">
        {step === 0 && (
          <AccountStep
            defaults={account}
            onNext={(v) => {
              setAccount(v);
              setStep(1);
            }}
          />
        )}
        {step === 1 && (
          <AboutStep
            defaults={about}
            onBack={() => setStep(0)}
            onNext={(v) => {
              setAbout(v);
              setStep(2);
            }}
          />
        )}
        {step === 2 && <InsuranceStep saving={saving} onBack={() => setStep(1)} onFinish={finish} />}
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

function AccountStep({ defaults, onNext }: { defaults: Account | null; onNext: (v: Account) => void }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Account>({
    resolver: zodResolver(accountSchema),
    defaultValues: defaults ?? { name: "", email: "", password: "", confirm: "", terms: false },
  });
  const password = watch("password");

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="su-name">Full name</Label>
        <Input id="su-name" autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? "su-name-error" : undefined} {...register("name")} />
        <FieldError id="su-name-error" message={errors.name?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-email">Email</Label>
        <Input id="su-email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} aria-describedby={errors.email ? "su-email-error" : undefined} {...register("email")} />
        <FieldError id="su-email-error" message={errors.email?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-password">Password</Label>
        <PasswordInput id="su-password" autoComplete="new-password" aria-invalid={!!errors.password} aria-describedby={errors.password ? "su-password-error" : undefined} {...register("password")} />
        <PasswordStrength value={password ?? ""} />
        <FieldError id="su-password-error" message={errors.password?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-confirm">Confirm password</Label>
        <PasswordInput id="su-confirm" autoComplete="new-password" aria-invalid={!!errors.confirm} aria-describedby={errors.confirm ? "su-confirm-error" : undefined} {...register("confirm")} />
        <FieldError id="su-confirm-error" message={errors.confirm?.message} />
      </div>
      <div className="space-y-2">
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-0.5 size-4 accent-[var(--primary)]" {...register("terms")} />
          <span className="text-muted-foreground">
            I agree to the terms of use and privacy notice. I understand this is a demo and no real health data is stored.
          </span>
        </label>
        <FieldError message={errors.terms?.message} />
      </div>
      <Button type="submit" size="lg" className="w-full">
        Continue <ArrowRight aria-hidden />
      </Button>
    </form>
  );
}

function AboutStep({ defaults, onBack, onNext }: { defaults: About | null; onBack: () => void; onNext: (v: About) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<About>({
    resolver: zodResolver(aboutSchema),
    defaultValues: defaults ?? { dob: "", phone: "", language: "English", department: "" },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="su-dob">Date of birth</Label>
        <Input id="su-dob" type="date" autoComplete="bday" aria-invalid={!!errors.dob} aria-describedby={errors.dob ? "su-dob-error" : undefined} {...register("dob")} />
        <FieldError id="su-dob-error" message={errors.dob?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-phone">Phone</Label>
        <Input id="su-phone" type="tel" autoComplete="tel" placeholder="+1 (555) 000-0000" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "su-phone-error" : undefined} {...register("phone")} />
        <FieldError id="su-phone-error" message={errors.phone?.message} />
      </div>
      <fieldset className="space-y-2 sm:col-span-2">
        <legend className="text-sm font-semibold">Sex</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {sexes.map((s) => (
            <label
              key={s}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm transition-colors has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-800 dark:has-[:checked]:bg-brand-950 dark:has-[:checked]:text-brand-200"
            >
              <input type="radio" value={s} className="accent-[var(--primary)]" {...register("sex")} />
              {s}
            </label>
          ))}
        </div>
        <FieldError message={errors.sex?.message} />
      </fieldset>
      <div className="space-y-2">
        <Label htmlFor="su-language">Preferred language</Label>
        <NativeSelect id="su-language" {...register("language")}>
          {languages.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-department">
          Main area of care <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <NativeSelect id="su-department" {...register("department")}>
          <option value="">Not sure yet</option>
          {departments.map((d) => (
            <option key={d.slug} value={d.slug}>{d.name}</option>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft aria-hidden /> Back
        </Button>
        <Button type="submit" size="lg">
          Continue <ArrowRight aria-hidden />
        </Button>
      </div>
    </form>
  );
}

function InsuranceStep({ saving, onBack, onFinish }: { saving: boolean; onBack: () => void; onFinish: (v: Insurance | null) => void }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Insurance>({
    resolver: zodResolver(insuranceSchema),
    defaultValues: { insurerId: "", plan: "", memberId: "", groupNumber: "" },
  });
  const insurer = insurersById[watch("insurerId")];

  return (
    <form onSubmit={handleSubmit((v) => onFinish(v))} noValidate className="space-y-5">
      <div className="flex items-start gap-3 rounded-2xl bg-brand-50 p-4 text-sm text-brand-900 dark:bg-brand-950 dark:text-brand-100">
        <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
        <p>Add your insurance now and we will show your share at booking and checkout. Our billing team checks every card. This step is optional.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="su-insurer">Insurer</Label>
          <NativeSelect
            id="su-insurer"
            aria-invalid={!!errors.insurerId} aria-describedby={errors.insurerId ? "su-insurer-error" : undefined}
            {...register("insurerId", { onChange: () => setValue("plan", "") })}
          >
            <option value="">Choose your insurer</option>
            {insurers.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </NativeSelect>
          <FieldError id="su-insurer-error" message={errors.insurerId?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="su-plan">Plan</Label>
          <NativeSelect id="su-plan" disabled={!insurer} aria-invalid={!!errors.plan} aria-describedby={errors.plan ? "su-plan-error" : undefined} {...register("plan")}>
            <option value="">{insurer ? "Choose a plan" : "Choose an insurer first"}</option>
            {insurer?.plans.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </NativeSelect>
          <FieldError id="su-plan-error" message={errors.plan?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="su-member">Member ID</Label>
          <Input id="su-member" placeholder="e.g. NWH-1234-5678" aria-invalid={!!errors.memberId} aria-describedby={errors.memberId ? "su-member-error" : undefined} {...register("memberId")} />
          <FieldError id="su-member-error" message={errors.memberId?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="su-group">
            Group number <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input id="su-group" placeholder="e.g. GRP-22018" {...register("groupNumber")} />
        </div>
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="ghost" onClick={onBack} disabled={saving}>
          <ArrowLeft aria-hidden /> Back
        </Button>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={() => onFinish(null)} disabled={saving}>
            <Wallet aria-hidden /> Skip, I&apos;ll pay myself
          </Button>
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? <LoaderCircle className="animate-spin" aria-hidden /> : <Check aria-hidden />}
            {saving ? "Creating account…" : "Create account"}
          </Button>
        </div>
      </div>
    </form>
  );
}
