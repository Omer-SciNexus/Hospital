import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Set a new password" };

export default function ResetPasswordPage() {
  return (
    <div>
      <h1 className="text-3xl font-extrabold sm:text-4xl">Set a new password</h1>
      <p className="mt-2 text-muted-foreground">Choose a password you don&apos;t use anywhere else.</p>
      <ResetPasswordForm />
    </div>
  );
}
