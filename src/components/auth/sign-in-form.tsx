"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { LoaderCircle, LogIn } from "lucide-react";
import { roles } from "@/config/navigation";
import { useSession } from "@/store/session";
import { safeNext } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/form-controls";
import { PasswordInput } from "./password-input";

const REMEMBER_KEY = "aurelia-remember-email";

const schema = z.object({
  email: z.email("Please enter a valid email"),
  password: z.string().min(6, "Password needs at least 6 characters"),
  remember: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

/** "jane.doe-smith@x.com" → "Jane Doe Smith". Falls back to the demo patient's name. */
export function nameFromEmail(email: string) {
  const local = email.split("@")[0]?.replace(/[0-9]+/g, " ") ?? "";
  const parts = local.split(/[._\-+\s]+/).filter((p) => p.length > 1);
  if (parts.length === 0) return roles[0].person;
  return parts
    .slice(0, 3)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}

/** Email + password sign-in. Any valid email and 6+ character password signs in as a patient. */
export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const signIn = useSession((s) => s.signIn);
  const next = params.get("next");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "", remember: true } });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) setValue("email", saved);
    } catch {}
  }, [setValue]);

  async function onSubmit(values: FormValues) {
    await new Promise((r) => setTimeout(r, 800));
    try {
      if (values.remember) localStorage.setItem(REMEMBER_KEY, values.email);
      else localStorage.removeItem(REMEMBER_KEY);
    } catch {}
    const name = nameFromEmail(values.email);
    signIn("patient", { name, email: values.email });
    toast.success(`Welcome back, ${name.split(" ")[0]}!`, { description: "You are signed in to your patient dashboard." });
    router.push(safeNext(next));
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="signin-email">Email</Label>
        <Input
          id="signin-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "signin-email-error" : undefined}
          {...register("email")}
        />
        <div id="signin-email-error">
          <FieldError message={errors.email?.message} />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="signin-password">Password</Label>
          <Link href="/forgot-password" className="text-sm font-semibold text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          id="signin-password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "signin-password-error" : undefined}
          {...register("password")}
        />
        <div id="signin-password-error">
          <FieldError message={errors.password?.message} />
        </div>
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" className="size-4 accent-[var(--primary)]" {...register("remember")} />
        <span>Remember me on this device</span>
      </label>
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <LoaderCircle className="animate-spin" aria-hidden /> : <LogIn aria-hidden />}
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/sign-up" className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
