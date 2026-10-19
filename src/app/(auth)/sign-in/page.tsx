import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Divider, SocialButtons } from "@/components/auth/social-buttons";
import { RolePicker } from "./role-picker";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <div>
      <h1 className="text-3xl font-extrabold sm:text-4xl">Welcome back</h1>
      <p className="mt-2 text-muted-foreground">
        Sign in to see your visits, results, orders and insurance. This is a demo: any email and a 6+ character password work.
      </p>
      <div className="mt-8 space-y-6">
        <SocialButtons />
        <Divider>or sign in with email</Divider>
        <Suspense>
          <SignInForm />
        </Suspense>
        <Divider>Or explore a demo role</Divider>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">Pick a role to open its dashboard. No password needed.</p>
      <Suspense>
        <RolePicker />
      </Suspense>
    </div>
  );
}
