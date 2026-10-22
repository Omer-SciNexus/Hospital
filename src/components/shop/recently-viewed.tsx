"use client";

import { useEffect, useMemo } from "react";
import { productsById } from "@/data/products";
import { useHydrated } from "@/lib/use-hydrated";
import { useShop } from "@/store/shop";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProductRow } from "./product-row";

/** "Recently viewed" row from the shop store. Renders nothing until there is history. */
export function RecentlyViewed({ excludeId, className }: { excludeId?: string; className?: string }) {
  const hydrated = useHydrated();
  const ids = useShop((s) => s.recentlyViewed);
  const items = useMemo(
    () => ids.filter((id) => id !== excludeId).map((id) => productsById[id]).filter(Boolean).slice(0, 8),
    [ids, excludeId],
  );
  if (!hydrated || items.length === 0) return null;
  return (
    <section className={className}>
      <SectionHeading eyebrow="Pick up where you left off" title="Recently viewed" />
      <ProductRow products={items} className="mt-6" />
    </section>
  );
}

/** Adds a product to "recently viewed" when its page opens. */
export function ViewedTracker({ id }: { id: string }) {
  const viewed = useShop((s) => s.viewed);
  useEffect(() => viewed(id), [id, viewed]);
  return null;
}
