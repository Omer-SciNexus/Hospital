"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { GitCompareArrows, X } from "lucide-react";
import { productsById } from "@/data/products";
import { useHydrated } from "@/lib/use-hydrated";
import { useShop, COMPARE_LIMIT } from "@/store/shop";
import { Button } from "@/components/ui/button";
import { isPortrait } from "./shop-utils";

/** Floating tray at the bottom of shop pages with the items picked for comparison. */
export function CompareTray() {
  const hydrated = useHydrated();
  const pathname = usePathname();
  const compare = useShop((s) => s.compare);
  const toggleCompare = useShop((s) => s.toggleCompare);
  const clearCompare = useShop((s) => s.clearCompare);
  const hidden = pathname.startsWith("/marketplace/compare") || pathname.startsWith("/marketplace/checkout");
  const items = compare.map((id) => productsById[id]).filter(Boolean);
  const show = hydrated && !hidden && items.length > 0;

  return (
    <AnimatePresence>
      {show && (
        <motion.aside
          aria-label="Compare tray"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
          className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-2xl items-center gap-3 rounded-3xl border border-border bg-surface/95 p-2.5 pl-4 shadow-lift backdrop-blur-xl sm:bottom-5"
        >
          <div className="hidden shrink-0 sm:block">
            <p className="text-sm font-bold">Compare</p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {items.length} of {COMPARE_LIMIT}
            </p>
          </div>
          <ul className="flex min-w-0 flex-1 gap-2">
            <AnimatePresence initial={false} mode="popLayout">
              {items.map((p) => (
                <motion.li
                  key={p.id}
                  layout
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  className="relative size-12 shrink-0 sm:size-14"
                >
                  <span className="relative block size-full overflow-hidden rounded-xl border border-border bg-surface-2" title={p.name}>
                    <Image src={p.image} alt={p.name} fill sizes="56px" className={isPortrait(p.image) ? "object-cover object-top" : "object-contain p-1"} />
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleCompare(p.id)}
                    aria-label={`Remove ${p.name} from compare`}
                    className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-foreground text-background shadow-soft"
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
            {Array.from({ length: COMPARE_LIMIT - items.length }).map((_, i) => (
              <li key={`empty-${i}`} aria-hidden className="hidden size-14 shrink-0 rounded-xl border border-dashed border-border sm:block" />
            ))}
          </ul>
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="sm" className="hidden px-3 sm:inline-flex" onClick={clearCompare}>
              Clear
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link href="/marketplace/compare">
                <GitCompareArrows aria-hidden /> Compare
              </Link>
            </Button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
