"use client";

import { toast } from "sonner";
import { Apple, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Visual-only social sign-in buttons. The demo has no real providers. */
export function SocialButtons() {
  const notice = (name: string) =>
    toast.info(`${name} sign-in is not part of this demo`, { description: "Use the email form or pick a demo role below." });
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Button type="button" variant="outline" onClick={() => notice("Google")}>
        <Mail aria-hidden /> Continue with Google
      </Button>
      <Button type="button" variant="outline" onClick={() => notice("Apple")}>
        <Apple aria-hidden /> Continue with Apple
      </Button>
    </div>
  );
}

/** Thin line with a label in the middle, e.g. "or". */
export function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      {children}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
