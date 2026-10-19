import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="text-3xl font-extrabold sm:text-4xl">Forgot your password?</h1>
      <p className="mt-2 text-muted-foreground">Type the email you signed up with. We&apos;ll send you a link to set a new password.</p>
      <ForgotPasswordForm />
    </div>
  );
}
