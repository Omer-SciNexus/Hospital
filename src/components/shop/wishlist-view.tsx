"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { productsById } from "@/data/products";
import { useHydrated } from "@/lib/use-hydrated";
import { useShop } from "@/store/shop";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ProductCard } from "./product-card";

/** Saved products from the shop store. */
export function WishlistView() {
  const hydrated = useHydrated();
  const ids = useShop((s) => s.wishlist);
  const items = useMemo(() => ids.map((id) => productsById[id]).filter(Boolean), [ids]);

  if (!hydrated) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4] rounded-3xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border">
        <EmptyState
          image="/images/dashboard/empty-orders.png"
          title="Your wishlist is empty"
          description="Tap the heart on any product to save it for later."
          action={
            <Button asChild>
              <Link href="/marketplace#catalog">
                Browse the marketplace <ArrowRight aria-hidden />
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <>
      <p className="mb-4 text-sm text-muted-foreground">
        <span className="font-bold text-foreground">{items.length}</span> saved {items.length === 1 ? "item" : "items"}
      </p>
      <motion.ul layout className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        <AnimatePresence mode="popLayout" initial={false}>
          {items.map((p) => (
            <motion.li key={p.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.25 }}>
              <ProductCard product={p} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </>
  );
}
