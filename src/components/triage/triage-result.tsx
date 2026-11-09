"use client";

import Link from "next/link";
import { ArrowRight, Clock, MapPin, Phone, RotateCcw, TriangleAlert } from "lucide-react";
import { departmentsBySlug } from "@/config/departments";
import { site } from "@/config/site";
import type { TriageResponse } from "@/lib/triage/types";
import { useTriage } from "@/store/triage";
import { Button } from "@/components/ui/button";

export function TriageResult({ result }: { result: Extract<TriageResponse, { kind: "result" }> }) {
  const setOpen = useTriage((s) => s.setOpen);
  const reset = useTriage((s) => s.reset);
  const department = departmentsBySlug[result.department];
  const close = () => setOpen(false);

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
      <div>
        <p className="text-sm font-semibold text-muted-foreground">The department for you</p>
        <h3 className="mt-1 font-display text-2xl font-extrabold">{department.name}</h3>
        <p className="mt-2">{result.reason}</p>
      </div>

      {result.urgency === "urgent" && (
        <div className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p className="text-sm">
            <strong>Please be seen today.</strong> Call us on{" "}
            <a href={`tel:${site.phone}`} className="font-bold underline underline-offset-2">
              {site.phone}
            </a>{" "}
            for the earliest visit.
          </p>
        </div>
      )}

      <dl className="space-y-2 rounded-2xl bg-muted p-4 text-sm">
        <div className="flex gap-2">
          <dt><MapPin className="mt-0.5 size-4" aria-label="Location" /></dt>
          <dd>{department.location}</dd>
        </div>
        <div className="flex gap-2">
          <dt><Clock className="mt-0.5 size-4" aria-label="Hours" /></dt>
          <dd>{department.hours}</dd>
        </div>
      </dl>

      <div>
        <h4 className="text-sm font-bold">Summary for your doctor</h4>
        <p className="mt-1 text-sm text-muted-foreground">{result.summary}</p>
      </div>

      <div className="flex flex-col gap-2">
        <Button asChild>
          <Link href={`/doctors?department=${department.slug}`} onClick={close}>
            See doctors <ArrowRight aria-hidden />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/departments/${department.slug}`} onClick={close}>
            About this department
          </Link>
        </Button>
        <Button variant="ghost" onClick={reset}>
          <RotateCcw aria-hidden /> Start over
        </Button>
      </div>

      <p className="flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-300">
        <Phone className="size-4 shrink-0" aria-hidden />
        <span>
          If you get worse, call{" "}
          <a href={`tel:${site.emergencyShort}`} className="underline underline-offset-2">
            {site.emergencyShort}
          </a>
          .
        </span>
      </p>
    </div>
  );
}
