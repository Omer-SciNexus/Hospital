"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Minus, ShoppingBag, X } from "lucide-react";
import { categoriesById } from "@/config/marketplace";
import { productsById, type Product } from "@/data/products";
import { useHydrated } from "@/lib/use-hydrated";
import { formatPrice } from "@/lib/utils";
import { useShop } from "@/store/shop";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/dashboard/empty-state";
import { addProductToCart } from "./cart-actions";
import { ProductImage } from "./product-image";
import { maxCoverage } from "./shop-utils";
import { Stars } from "./stars";

const yes = (on: boolean, label?: string) =>
  on ? (
    <span className="inline-flex items-center gap-1 font-semibold text-green-700 dark:text-green-400">
      <Check className="size-4" aria-hidden /> {label ?? "Yes"}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <Minus className="size-4" aria-hidden /> No
    </span>
  );

/** Side-by-side table of the products in the compare tray. */
export function CompareView() {
  const hydrated = useHydrated();
  const ids = useShop((s) => s.compare);
  const toggleCompare = useShop((s) => s.toggleCompare);
  const clearCompare = useShop((s) => s.clearCompare);
  const items = useMemo(() => ids.map((id) => productsById[id]).filter(Boolean), [ids]);

  if (!hydrated) return <Skeleton className="h-96 rounded-3xl" />;

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border">
        <EmptyState
          image="/images/dashboard/empty-search.png"
          title="Nothing to compare yet"
          description="Tap the compare icon on up to 4 products, then come back here to see them side by side."
          action={
            <Button asChild>
              <Link href="/marketplace#catalog">
                Browse products <ArrowRight aria-hidden />
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  const specLabels = Array.from(new Set(items.flatMap((p) => p.specs.map(([k]) => k))));
  const rows: [string, (p: Product) => React.ReactNode][] = [
    ["Price", (p) => (
      <span>
        <span className="font-display text-lg font-extrabold">{formatPrice(p.price)}</span>
        {p.oldPrice && <s className="ml-2 text-muted-foreground">{formatPrice(p.oldPrice)}</s>}
      </span>
    )],
    ["Rating", (p) => <Stars rating={p.rating} reviews={p.reviews} />],
    ["Insurance", (p) => {
      const c = maxCoverage(p);
      return c ? <span className="font-semibold text-green-700 dark:text-green-400">Up to {c}%</span> : <span className="text-muted-foreground">Not covered</span>;
    }],
    ["Prescription", (p) => (p.rx ? <span className="font-semibold text-red-700 dark:text-red-300">Required</span> : <span className="text-muted-foreground">Not needed</span>)],
    ["Rent", (p) => yes(!!p.rent, p.rent ? `$${p.rent.weekly}/wk + $${p.rent.deposit} deposit` : undefined)],
    ["Delivery", (p) => p.delivery],
    ["Brand", (p) => p.brand],
    ["Category", (p) => categoriesById[p.category].name],
    ...specLabels.map((label) => [label, (p: Product) => p.specs.find(([k]) => k === label)?.[1] ?? <span className="text-muted-foreground">–</span>] as [string, (p: Product) => React.ReactNode]),
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Comparing <span className="font-bold text-foreground">{items.length}</span> of 4
        </p>
        <Button variant="ghost" size="sm" onClick={clearCompare}>
          <X aria-hidden /> Clear all
        </Button>
      </div>
      <div className="relative overflow-x-auto rounded-3xl border border-border bg-surface shadow-soft">
        <table className="w-full min-w-[640px] table-fixed text-sm">
          <caption className="sr-only">Product comparison</caption>
          <thead>
            <tr className="border-b border-border align-top">
              <th scope="col" className="sticky left-0 z-10 w-32 bg-surface p-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground sm:w-40">
                Product
              </th>
              <AnimatePresence initial={false}>
                {items.map((p) => (
                  <motion.th
                    key={p.id}
                    scope="col"
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-4 text-left font-normal"
                  >
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => toggleCompare(p.id)}
                        aria-label={`Remove ${p.name} from compare`}
                        className="absolute right-1 top-1 z-10 grid size-7 place-items-center rounded-full bg-surface text-muted-foreground shadow-soft ring-1 ring-border hover:text-red-600"
                      >
                        <X className="size-3.5" aria-hidden />
                      </button>
                      <Link href={`/marketplace/${p.id}`} className="block">
                        <ProductImage product={p} sizes="200px" className="aspect-square rounded-2xl" />
                        <span className="mt-3 line-clamp-2 block font-bold hover:text-primary">{p.name}</span>
                      </Link>
                      <Button size="sm" className="mt-3 w-full" onClick={() => addProductToCart(p)}>
                        <ShoppingBag aria-hidden /> Add to cart
                      </Button>
                    </div>
                  </motion.th>
                ))}
              </AnimatePresence>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, render]) => (
              <tr key={label} className="border-b border-border last:border-b-0 even:bg-surface-2/40">
                <th scope="row" className="sticky left-0 z-10 bg-surface p-4 text-left font-semibold">{label}</th>
                {items.map((p) => (
                  <td key={p.id} className="p-4 align-top">{render(p)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
