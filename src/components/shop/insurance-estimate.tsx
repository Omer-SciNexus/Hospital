"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldAlert, ShieldCheck, ShieldOff } from "lucide-react";
import { insurers, insurersById } from "@/data/insurers";
import { DEMO_PATIENT_ID } from "@/data/patients";
import type { Product } from "@/data/products";
import { coverageFor } from "@/lib/insurance";
import { useHydrated } from "@/lib/use-hydrated";
import { cn, formatPrice } from "@/lib/utils";
import { useInsurance } from "@/store/insurance";
import { useSession } from "@/store/session";
import { Label, NativeSelect } from "@/components/ui/form-controls";
import { InsurerLogo } from "@/components/marketing/insurer-logo";
import { round2 } from "./shop-utils";

/** Live "insurance pays X% · you pay $Y" box. Uses the signed-in patient's primary card when there is one. */
export function InsuranceEstimate({ product, price }: { product: Product; price: number }) {
  const hydrated = useHydrated();
  const role = useSession((s) => s.role);
  const cards = useInsurance((s) => s.cards);
  const myCard = useMemo(() => {
    const mine = cards.filter((c) => c.patientId === DEMO_PATIENT_ID && c.status !== "rejected");
    return mine.find((c) => c.primary) ?? mine[0];
  }, [cards]);
  const usable = hydrated && role === "patient" ? myCard : undefined;

  const [picked, setPicked] = useState<string | null>(null);
  const insurerId = picked ?? usable?.insurerId ?? "";
  const insurer = insurerId ? insurersById[insurerId] : undefined;
  const share = coverageFor(product, insurer);
  const youPay = round2(price * (1 - share / 100));
  const usingCard = !!usable && insurerId === usable.insurerId;

  if (product.coverage === 0) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface-2 p-4 text-sm">
        <ShieldOff className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
        <p>
          <span className="font-semibold">Not usually covered by insurance.</span>{" "}
          <span className="text-muted-foreground">You can still pay with a health savings card at checkout.</span>
        </p>
      </div>
    );
  }

  return (
    <section aria-labelledby="ins-est" className="rounded-2xl border border-border bg-surface p-4 shadow-soft sm:p-5">
      <div className="flex items-center gap-3">
        <Image src="/images/icons/insurance/coverage.png" alt="" width={40} height={40} className="size-10" />
        <div>
          <h2 id="ins-est" className="text-base font-bold">Insurance estimate</h2>
          <p className="text-xs text-muted-foreground">Final amount is confirmed by billing after checkout.</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor={`ins-${product.id}`}>Your insurance</Label>
        <NativeSelect id={`ins-${product.id}`} value={insurerId} onChange={(e) => setPicked(e.target.value)}>
          <option value="">Pick your insurer</option>
          {insurers.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
              {usable?.insurerId === i.id ? " (your card)" : ""}
            </option>
          ))}
        </NativeSelect>
        {usingCard && (
          <p className="text-xs text-muted-foreground">
            Using your {usable.plan} card ·{" "}
            <span className={cn("font-semibold", usable.status === "verified" ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400")}>
              {usable.status === "verified" ? "Verified" : "Waiting for billing check"}
            </span>
          </p>
        )}
        {hydrated && !role && (
          <p className="text-xs text-muted-foreground">
            <Link href="/sign-in" className="font-semibold text-primary hover:underline">Sign in</Link> to use your saved card.
          </p>
        )}
      </div>

      {insurer ? (
        <div aria-live="polite" className="mt-4 rounded-xl bg-surface-2 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <InsurerLogo insurer={insurer} className="text-sm" />
            {insurer.network === "in-network" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700 dark:bg-green-950 dark:text-green-300">
                <Image src="/images/icons/insurance/in-network.png" alt="" width={16} height={16} className="size-4" />
                In network
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                <ShieldAlert className="size-3.5" aria-hidden /> Partly in network
              </span>
            )}
          </div>
          <p className="mt-3 flex flex-wrap items-baseline gap-x-2 text-sm">
            <ShieldCheck className="size-4 self-center text-green-700 dark:text-green-400" aria-hidden />
            <span>
              Insurance pays <span className="font-display text-lg font-extrabold text-green-700 dark:text-green-400">{share}%</span>
            </span>
            <span className="text-muted-foreground">·</span>
            <span>
              you pay <span className="font-display text-lg font-extrabold">{formatPrice(youPay)}</span>
            </span>
          </p>
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-surface-2 p-4 text-sm text-muted-foreground">
          Plans usually pay up to <span className="font-semibold text-foreground">{product.coverage}%</span> of this item. Pick your insurer to see your share.
        </p>
      )}
    </section>
  );
}
