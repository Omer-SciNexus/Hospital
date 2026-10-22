"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FileText, Heart, PackageCheck, ShoppingBag, Truck, Zap } from "lucide-react";
import { isService, type Product } from "@/data/products";
import { useHydrated } from "@/lib/use-hydrated";
import { cn, formatPrice } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { useShop } from "@/store/shop";
import { Button } from "@/components/ui/button";
import { addProductToCart, toggleWishlistWithToast } from "./cart-actions";
import { InsuranceEstimate } from "./insurance-estimate";
import { cartItemFor, discountPct, priceFor } from "./shop-utils";
import { Stepper } from "./stepper";

/** Buy / rent toggle, quantity, add to cart and buy now. `variant="quick"` is the slimmer quick-view version. */
export function ProductPurchase({ product: p, variant = "page", onDone }: { product: Product; variant?: "page" | "quick"; onDone?: () => void }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const wished = useShop((s) => s.wishlist.includes(p.id)) && hydrated;
  const [mode, setMode] = useState<"buy" | "rent">("buy");
  const [weeks, setWeeks] = useState(2);
  const [qty, setQty] = useState(1);
  const unit = priceFor(p, mode, weeks);
  const off = discountPct(p);
  const outOfStock = p.stock <= 0;

  function add() {
    addProductToCart(p, { mode, weeks, quantity: qty });
    onDone?.();
  }
  function buyNow() {
    useCart.getState().add(cartItemFor(p, mode, weeks), qty);
    onDone?.();
    router.push("/marketplace/checkout");
  }

  return (
    <div className="space-y-5">
      {p.rent && (
        <div role="radiogroup" aria-label="Buy or rent" className="relative grid grid-cols-2 rounded-full bg-muted p-1">
          {(["buy", "rent"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className={cn("relative z-10 h-10 rounded-full text-sm font-semibold transition-colors", mode === m ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {mode === m && (
                <motion.span layoutId={`mode-${variant}-${p.id}`} className="absolute inset-0 -z-10 rounded-full bg-surface shadow-soft" transition={{ type: "spring", bounce: 0.2, duration: 0.4 }} />
              )}
              {m === "buy" ? `Buy · ${formatPrice(p.price)}` : `Rent · ${formatPrice(p.rent!.weekly)}/wk`}
            </button>
          ))}
        </div>
      )}

      <div>
        {mode === "rent" && p.rent ? (
          <>
            <p className="font-display text-3xl font-extrabold tabular-nums">
              {formatPrice(p.rent.weekly)}
              <span className="text-base font-semibold text-muted-foreground"> / week</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Plus a {formatPrice(p.rent.deposit)} refundable deposit. {weeks} {weeks === 1 ? "week" : "weeks"} ={" "}
              <span className="font-semibold text-foreground">{formatPrice(unit)}</span> today.
            </p>
          </>
        ) : (
          <p className="flex flex-wrap items-baseline gap-x-3">
            <span className="font-display text-3xl font-extrabold tabular-nums">{formatPrice(p.price)}</span>
            {p.oldPrice && (
              <>
                <s className="text-muted-foreground">{formatPrice(p.oldPrice)}</s>
                <span className="text-sm font-bold text-coral-700 dark:text-orange-300">Save {off}%</span>
              </>
            )}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {mode === "rent" && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Weeks</span>
            <Stepper label="Weeks" value={weeks} onChange={setWeeks} min={1} max={26} />
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{isService(p) ? "People" : "Quantity"}</span>
          <Stepper label={isService(p) ? "People" : "Quantity"} value={qty} onChange={setQty} min={1} max={Math.max(1, Math.min(10, p.stock))} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="lg" className="flex-1" onClick={add} disabled={outOfStock}>
          <ShoppingBag aria-hidden /> Add to cart
        </Button>
        <Button size="lg" variant="accent" className="flex-1" onClick={buyNow} disabled={outOfStock}>
          <Zap aria-hidden /> {isService(p) ? "Book now" : mode === "rent" ? "Rent now" : "Buy now"}
        </Button>
        {variant === "page" && (
          <Button
            size="icon"
            variant="outline"
            className="size-13"
            aria-pressed={wished}
            aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
            onClick={() => toggleWishlistWithToast(p)}
          >
            <Heart className={cn(wished && "fill-coral-500 text-coral-500")} aria-hidden />
          </Button>
        )}
      </div>

      <ul className="space-y-2 text-sm">
        <li className="flex items-center gap-2">
          <Truck className="size-4 text-brand-700 dark:text-brand-300" aria-hidden />
          <span>
            <span className="font-semibold">{p.delivery}</span>
            <span className="text-muted-foreground">{isService(p) ? " · pick a time at checkout" : " · free over $50"}</span>
          </span>
        </li>
        <li className="flex items-center gap-2">
          <PackageCheck className="size-4 text-brand-700 dark:text-brand-300" aria-hidden />
          {p.stock > 20 ? <span>In stock</span> : <span className="font-semibold text-coral-700 dark:text-orange-300">Only {p.stock} left</span>}
        </li>
      </ul>

      {p.rx && (
        <div className={cn("flex items-center gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/50", variant === "quick" && "p-3")}>
          {variant === "page" && <Image src="/images/dashboard/upload-rx.png" alt="" width={72} height={72} className="size-16 shrink-0" />}
          <p className="text-sm">
            <span className="flex items-center gap-1.5 font-bold text-red-700 dark:text-red-300">
              <FileText className="size-4" aria-hidden /> Prescription needed
            </span>
            <span className="text-red-900/80 dark:text-red-100/80">
              Upload it at checkout, or tell us your doctor here already sent it. A pharmacist checks every Rx before we ship.
            </span>
          </p>
        </div>
      )}

      {variant === "page" && <InsuranceEstimate product={p} price={unit} />}
    </div>
  );
}
