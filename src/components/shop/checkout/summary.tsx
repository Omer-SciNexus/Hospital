"use client";

import Image from "next/image";
import { Check, ChevronDown, FileText, ShieldCheck } from "lucide-react";
import type { Insurer } from "@/data/insurers";
import { cn, formatPrice } from "@/lib/utils";
import { isPortrait, rentLabel } from "../shop-utils";
import type { computeTotals } from "./totals";

type Totals = ReturnType<typeof computeTotals>;

function Lines({ totals, insurer }: { totals: Totals; insurer?: Insurer | null }) {
  return (
    <ul className="space-y-3">
      {totals.lines.map((l) => {
        const rent = rentLabel(l);
        return (
          <li key={l.id} className="flex gap-3">
            <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
              <Image src={l.image} alt="" fill sizes="56px" className={isPortrait(l.image) ? "object-cover object-top" : "object-contain p-1"} />
              <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background tabular-nums">
                {l.quantity}
              </span>
            </span>
            <div className="min-w-0 flex-1 text-sm">
              <p className="line-clamp-2 font-semibold leading-snug">{l.name}</p>
              {rent && <p className="text-xs text-muted-foreground">{rent}</p>}
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
                {l.rx && (
                  <span className="inline-flex items-center gap-0.5 font-semibold text-red-700 dark:text-red-300">
                    <FileText className="size-3" aria-hidden /> Rx
                  </span>
                )}
                {insurer &&
                  (l.share > 0 ? (
                    <span className="font-semibold text-green-700 dark:text-green-400">Insurance pays {l.share}%</span>
                  ) : (
                    <span className="text-muted-foreground">Not covered</span>
                  ))}
              </div>
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums">{formatPrice(l.price * l.quantity)}</span>
          </li>
        );
      })}
    </ul>
  );
}

function Totals({ totals, insurer }: { totals: Totals; insurer?: Insurer | null }) {
  return (
    <dl className="space-y-1.5 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Subtotal</dt>
        <dd className="tabular-nums">{formatPrice(totals.subtotal)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Delivery</dt>
        <dd className={cn("tabular-nums", totals.fee === 0 && "text-green-700 dark:text-green-400")}>{totals.fee === 0 ? "Free" : formatPrice(totals.fee)}</dd>
      </div>
      {insurer && (
        <div className="flex justify-between font-semibold text-green-700 dark:text-green-400">
          <dt className="flex items-center gap-1">
            <ShieldCheck className="size-4" aria-hidden /> {insurer.name} pays
          </dt>
          <dd className="tabular-nums">−{formatPrice(totals.insurancePays)}</dd>
        </div>
      )}
      <div className="flex items-baseline justify-between border-t border-border pt-3">
        <dt className="font-bold">You pay</dt>
        <dd className="font-display text-2xl font-extrabold tabular-nums">{formatPrice(totals.total)}</dd>
      </div>
    </dl>
  );
}

/** Order summary: sticky card on desktop, collapsible bar on mobile. */
export function OrderSummary({ totals, insurer, estimate }: { totals: Totals; insurer?: Insurer | null; estimate?: boolean }) {
  const count = totals.lines.reduce((n, l) => n + l.quantity, 0);
  const note = estimate && insurer ? <p className="text-xs text-amber-700 dark:text-amber-400">Estimate only: billing will confirm your card.</p> : null;
  return (
    <>
      <details className="group rounded-2xl border border-border bg-surface shadow-soft lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2 text-sm font-semibold">
            Order summary · {count} {count === 1 ? "item" : "items"}
            <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
          </span>
          <span className="font-display text-lg font-extrabold tabular-nums">{formatPrice(totals.total)}</span>
        </summary>
        <div className="space-y-4 border-t border-border p-4">
          <Lines totals={totals} insurer={insurer} />
          <Totals totals={totals} insurer={insurer} />
          {note}
        </div>
      </details>
      <aside aria-label="Order summary" className="hidden rounded-3xl border border-border bg-surface p-6 shadow-soft lg:block">
        <h2 className="text-lg font-bold">Order summary</h2>
        <div className="mt-4 max-h-80 overflow-y-auto pr-1">
          <Lines totals={totals} insurer={insurer} />
        </div>
        <div className="mt-5 border-t border-border pt-4">
          <Totals totals={totals} insurer={insurer} />
        </div>
        {note && <div className="mt-3">{note}</div>}
      </aside>
    </>
  );
}

export function StepIndicator({ steps, current, onGo }: { steps: { id: string; label: string }[]; current: number; onGo: (i: number) => void }) {
  return (
    <nav aria-label="Checkout steps">
      <p className="text-sm font-semibold sm:hidden">
        Step {current + 1} of {steps.length} · {steps[current].label}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted sm:hidden">
        <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${((current + 1) / steps.length) * 100}%` }} />
      </div>
      <ol className="hidden items-center sm:flex">
        {steps.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={s.id} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                disabled={!done}
                onClick={() => onGo(i)}
                aria-current={active ? "step" : undefined}
                aria-label={`Step ${i + 1}: ${s.label}${done ? ", done" : ""}`}
                className="flex items-center gap-2 rounded-full pr-2 text-sm font-semibold disabled:cursor-default"
              >
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full border-2 text-xs font-bold transition-colors",
                    done && "border-primary bg-primary text-primary-foreground",
                    active && "border-primary text-primary",
                    !done && !active && "border-border text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-4" aria-hidden /> : i + 1}
                </span>
                <span className={cn("whitespace-nowrap", !active && "hidden md:inline", !done && !active && "text-muted-foreground", done && "hover:text-primary")}>{s.label}</span>
              </button>
              {i < steps.length - 1 && <span className={cn("mx-2 h-0.5 flex-1 rounded-full", done ? "bg-primary" : "bg-border")} aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
