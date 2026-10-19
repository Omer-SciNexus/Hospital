import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <div>
      <h1 className="text-3xl font-extrabold sm:text-4xl">Create your account</h1>
      <p className="mt-2 text-muted-foreground">Three short steps. Book visits, see results and order medicines in one place.</p>
      <SignUpForm />
    </div>
  );
}
