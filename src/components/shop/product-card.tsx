"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, GitCompareArrows, Heart, Plus, ShieldCheck } from "lucide-react";
import { categoriesById } from "@/config/marketplace";
import type { Product } from "@/data/products";
import { useHydrated } from "@/lib/use-hydrated";
import { cn, formatPrice } from "@/lib/utils";
import { useShop } from "@/store/shop";
import { Button } from "@/components/ui/button";
import { addProductToCart, toggleCompareWithToast, toggleWishlistWithToast } from "./cart-actions";
import { ImageBadges, ServiceChips } from "./product-badges";
import { ProductImage } from "./product-image";
import { QuickView } from "./quick-view";
import { maxCoverage } from "./shop-utils";
import { Stars } from "./stars";

const iconBtn =
  "grid size-9 place-items-center rounded-full bg-surface/90 text-foreground shadow-soft ring-1 ring-border backdrop-blur transition-all hover:scale-105 hover:text-primary";

/** Catalog tile. `layout="list"` gives the wide row used by the list view. */
export function ProductCard({ product: p, layout = "grid", className }: { product: Product; layout?: "grid" | "list"; className?: string }) {
  const hydrated = useHydrated();
  const wished = useShop((s) => s.wishlist.includes(p.id)) && hydrated;
  const comparing = useShop((s) => s.compare.includes(p.id)) && hydrated;
  const [quick, setQuick] = useState(false);
  const cover = maxCoverage(p);
  const list = layout === "list";
  const href = `/marketplace/${p.id}`;

  return (
    <article
      className={cn(
        "group relative flex h-full overflow-hidden rounded-3xl border border-border bg-surface shadow-soft transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-brand-300/60 hover:shadow-lift dark:hover:border-brand-700",
        list ? "flex-row" : "flex-col",
        className,
      )}
    >
      <div className={cn("relative shrink-0", list ? "w-32 sm:w-52" : "w-full")}>
        <Link href={href} tabIndex={-1} aria-hidden className="block">
          <ProductImage
            product={p}
            sizes={list ? "208px" : "(min-width: 1280px) 300px, (min-width: 640px) 33vw, 50vw"}
            className={cn(list ? "h-full min-h-32" : "aspect-square")}
            imgClassName="transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
        <ImageBadges product={p} className="pointer-events-none absolute left-3 top-3 max-w-[70%]" />
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
          <button
            type="button"
            aria-pressed={wished}
            aria-label={wished ? `Remove ${p.name} from wishlist` : `Save ${p.name} to wishlist`}
            onClick={() => toggleWishlistWithToast(p)}
            className={iconBtn}
          >
            <Heart className={cn("size-4 transition-colors", wished && "fill-coral-500 text-coral-500")} aria-hidden />
          </button>
        </div>
        {!list && (
          <div className="absolute inset-x-3 bottom-3 z-10 flex justify-center opacity-100 transition-all duration-300 md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100">
            <Button size="sm" variant="white" className="h-8 shadow-lift ring-1 ring-border dark:bg-surface dark:text-foreground" onClick={() => setQuick(true)}>
              <Eye aria-hidden /> Quick view
            </Button>
          </div>
        )}
      </div>

      <div className={cn("flex min-w-0 flex-1 flex-col", list ? "p-4 sm:p-5" : "p-4")}>
        <p className="truncate text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {p.brand} · {categoriesById[p.category].name}
        </p>
        <h3 className={cn("mt-1 font-bold leading-snug", list ? "text-base sm:text-lg" : "line-clamp-2 min-h-[2.75em] text-[15px]")}>
          <Link href={href} className="after:absolute after:inset-0 after:z-0 hover:text-primary focus-visible:outline-none">
            {p.name}
          </Link>
        </h3>
        <Stars rating={p.rating} reviews={p.reviews} className="mt-1.5" />
        {list && <p className="mt-2 line-clamp-2 hidden text-sm text-muted-foreground sm:block">{p.description}</p>}
        <ServiceChips product={p} className="mt-2" />

        <div className="mt-auto pt-3">
          <p className="flex items-baseline gap-2">
            <span className="font-display text-xl font-extrabold tabular-nums">{formatPrice(p.price)}</span>
            {p.oldPrice && <s className="text-sm text-muted-foreground">{formatPrice(p.oldPrice)}</s>}
          </p>
          {cover > 0 ? (
            <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
              <ShieldCheck className="size-3.5" aria-hidden /> Insurance may pay up to {cover}%
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">Not covered by insurance</p>
          )}
          <div className="relative z-10 mt-3 flex items-center gap-2">
            <Button size="sm" className="flex-1" onClick={() => addProductToCart(p)} aria-label={`Add ${p.name} to cart`}>
              <Plus aria-hidden /> Add
            </Button>
            {list && (
              <Button size="sm" variant="outline" onClick={() => setQuick(true)} aria-label={`Quick view ${p.name}`}>
                <Eye aria-hidden /> <span className="hidden sm:inline">Quick view</span>
              </Button>
            )}
            <button
              type="button"
              aria-pressed={comparing}
              aria-label={comparing ? `Remove ${p.name} from compare` : `Compare ${p.name}`}
              title="Compare"
              onClick={() => toggleCompareWithToast(p)}
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-full border transition-colors",
                comparing
                  ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-200"
                  : "border-border text-muted-foreground hover:border-blue-400 hover:text-blue-700 dark:hover:text-blue-300",
              )}
            >
              <GitCompareArrows className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      {quick && <QuickView product={p} open={quick} onOpenChange={setQuick} />}
    </article>
  );
}
