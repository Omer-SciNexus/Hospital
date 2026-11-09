"use client";

import { ArrowRight, Stethoscope } from "lucide-react";
import { useTriage } from "@/store/triage";

export function TriageBanner() {
  const setOpen = useTriage((s) => s.setOpen);

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex w-full flex-col gap-3 rounded-3xl border border-brand-200 bg-brand-50 p-6 text-left text-brand-900 transition-colors hover:bg-brand-100 sm:flex-row sm:items-center sm:justify-between dark:border-brand-900 dark:bg-brand-950/50 dark:text-brand-100 dark:hover:bg-brand-900/60"
    >
      <span className="flex items-center gap-3 font-semibold">
        <Stethoscope className="size-6 shrink-0 text-primary" aria-hidden />
        Not sure where to go? Tell us what is wrong and we will find your department.
      </span>
      <span className="flex shrink-0 items-center gap-1 font-bold">
        Find my department <ArrowRight className="size-4" aria-hidden />
      </span>
    </button>
  );
}
