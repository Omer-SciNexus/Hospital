"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CircleCheck, KeyRound, LoaderCircle, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Label } from "@/components/ui/form-controls";
import { PasswordInput } from "./password-input";
import { PasswordStrength } from "./password-strength";

const schema = z
  .object({
    password: z.string().min(6, "Password needs at least 6 characters"),
    confirm: z.string().min(1, "Please type your new password again"),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match" });

type FormValues = z.infer<typeof schema>;

/** Demo reset page reached from the "check your inbox" screen. */
export function ResetPasswordForm() {
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { password: "", confirm: "" } });

  async function onSubmit() {
    await new Promise((r) => setTimeout(r, 800));
    setDone(true);
    toast.success("Password updated");
  }

  if (done) {
    return (
      <div className="mt-8 rounded-3xl border border-border bg-surface p-6 text-center shadow-soft sm:p-8" role="status">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-200">
          <CircleCheck className="size-7" aria-hidden />
        </span>
        <h2 className="mt-4 text-2xl font-extrabold">Password updated</h2>
        <p className="mt-2 text-sm text-muted-foreground">You can now sign in with your new password.</p>
        <Button asChild size="lg" className="mt-6 w-full">
          <Link href="/sign-in">
            <LogIn aria-hidden /> Go to sign in
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
      <div className="space-y-2">
        <Label htmlFor="rp-password">New password</Label>
        <PasswordInput id="rp-password" autoComplete="new-password" aria-invalid={!!errors.password} {...register("password")} />
        <PasswordStrength value={watch("password") ?? ""} />
        <FieldError message={errors.password?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rp-confirm">Confirm new password</Label>
        <PasswordInput id="rp-confirm" autoComplete="new-password" aria-invalid={!!errors.confirm} {...register("confirm")} />
        <FieldError message={errors.confirm?.message} />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <LoaderCircle className="animate-spin" aria-hidden /> : <KeyRound aria-hidden />}
        {isSubmitting ? "Saving…" : "Set new password"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/sign-in" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
