"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Timer } from "lucide-react";
import type { Product } from "@/data/products";
import { Button } from "@/components/ui/button";
import { ProductCard } from "./product-card";

let now = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 1000);
  }
  queueMicrotask(cb);
  return () => {
    listeners.delete(cb);
    if (!listeners.size) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

/** Current time, ticking every second. 0 on the server and during hydration, so markup always matches. */
function useNow() {
  return useSyncExternalStore(subscribe, () => now, () => 0);
}

function endOfDay(t: number) {
  const d = new Date(t);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function Countdown() {
  const t = useNow();
  const left = t ? Math.max(0, endOfDay(t) - t) : 0;
  const parts = [Math.floor(left / 3_600_000), Math.floor((left / 60_000) % 60), Math.floor((left / 1000) % 60)];
  const labels = ["hours", "minutes", "seconds"];
  return (
    <div className="flex items-center gap-1.5" role="timer" aria-label={t ? `Ends in ${parts[0]} hours ${parts[1]} minutes` : "Ends tonight"}>
      {parts.map((n, i) => (
        <span key={labels[i]} className="flex items-center gap-1.5">
          <span className="grid min-w-11 place-items-center rounded-xl bg-white px-2 py-1.5 font-display text-xl font-extrabold tabular-nums text-coral-700 shadow-soft">
            {t ? String(n).padStart(2, "0") : "--"}
          </span>
          {i < 2 && <span className="font-bold text-white/80" aria-hidden>:</span>}
        </span>
      ))}
    </div>
  );
}

/** Coral strip with a live countdown to midnight and the current deals. */
export function FlashSale({ products }: { products: Product[] }) {
  return (
    <section aria-labelledby="flash-title" className="overflow-hidden rounded-3xl bg-gradient-to-br from-coral-700 via-coral-600 to-rose-700 p-5 shadow-lift sm:p-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4 text-white">
          <Image src="/images/marketplace/banners/banner-flash-sale.png" alt="" width={88} height={88} className="hidden size-20 rounded-2xl object-cover ring-2 ring-white/30 sm:block" />
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/85">
              <Timer className="size-4" aria-hidden /> Today only
            </p>
            <h2 id="flash-title" className="mt-1 text-2xl font-extrabold sm:text-3xl">Flash sale</h2>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Countdown />
          <Button asChild variant="white" size="sm">
            <Link href="/marketplace?tag=deal#catalog">
              All deals <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
      <ul className="scrollbar-none mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1">
        {products.map((p) => (
          <li key={p.id} className="w-[220px] shrink-0 snap-start sm:w-[240px] lg:w-[calc((100%-3rem)/4)] xl:w-[calc((100%-4rem)/5)]">
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}
