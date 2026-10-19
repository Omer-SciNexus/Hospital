"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, KeyRound, LoaderCircle, MailCheck, RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/form-controls";

const schema = z.object({ email: z.email("Please enter a valid email") });
type FormValues = z.infer<typeof schema>;

const COOLDOWN = 30;

/** Request a reset link, then show a "check your inbox" state with a resend cooldown. */
export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function onSubmit(values: FormValues) {
    await new Promise((r) => setTimeout(r, 800));
    setSentTo(values.email);
    setCooldown(COOLDOWN);
  }

  async function resend() {
    setResending(true);
    await new Promise((r) => setTimeout(r, 700));
    setResending(false);
    setCooldown(COOLDOWN);
    toast.success("Reset link sent again", { description: `Check ${sentTo}.` });
  }

  if (sentTo) {
    return (
      <div className="mt-8 rounded-3xl border border-border bg-surface p-6 text-center shadow-soft sm:p-8" role="status">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200">
          <MailCheck className="size-7" aria-hidden />
        </span>
        <h2 className="mt-4 text-2xl font-extrabold">Check your inbox</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a reset link to <span className="font-semibold text-foreground">{sentTo}</span>. It works for 30 minutes.
          Check your spam folder if you don&apos;t see it.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button asChild size="lg">
            <Link href="/reset-password">
              <KeyRound aria-hidden /> Open the reset link (demo)
            </Link>
          </Button>
          <Button variant="outline" onClick={resend} disabled={cooldown > 0 || resending}>
            {resending ? <LoaderCircle className="animate-spin" aria-hidden /> : <RotateCcw aria-hidden />}
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
          </Button>
          <Button variant="ghost" onClick={() => setSentTo(null)}>
            Use a different email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
      <div className="space-y-2">
        <Label htmlFor="fp-email">Email</Label>
        <Input id="fp-email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} {...register("email")} />
        <FieldError message={errors.email?.message} />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <LoaderCircle className="animate-spin" aria-hidden /> : <Send aria-hidden />}
        {isSubmitting ? "Sending…" : "Send reset link"}
      </Button>
      <p className="text-center text-sm">
        <Link href="/sign-in" className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
          <ArrowLeft className="size-4" aria-hidden /> Back to sign in
        </Link>
      </p>
    </form>
  );
}
