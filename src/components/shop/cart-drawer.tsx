"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, FileText, ShieldCheck, ShoppingBag, Trash2, Truck } from "lucide-react";
import { useHydrated } from "@/lib/use-hydrated";
import { cn, formatPrice } from "@/lib/utils";
import { selectCartCount, selectCartSubtotal, useCart } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { FREE_DELIVERY_FROM, deliveryFeeFor, isPhysical, isPortrait, rentLabel } from "./shop-utils";
import { Stepper } from "./stepper";

/** Right-side cart. Mounted once per layout; opened from the header cart button and the "View cart" toast. */
export function CartDrawer() {
  const hydrated = useHydrated();
  const open = useCart((s) => s.open);
  const setOpen = useCart((s) => s.setOpen);
  const items = useCart((s) => s.items);
  const count = useCart(selectCartCount);
  const subtotal = useCart(selectCartSubtotal);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);

  const hasGoods = items.some(isPhysical);
  const fee = deliveryFeeFor(items);
  const left = Math.max(0, FREE_DELIVERY_FROM - subtotal);

  return (
    <Sheet open={hydrated && open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full max-w-md sm:w-[440px]" aria-describedby={undefined}>
        <div className="border-b border-border px-5 pb-4 pt-5">
          <SheetTitle className="flex items-center gap-2 pr-10 font-display text-xl font-extrabold">
            <ShoppingBag className="size-5 text-primary" aria-hidden /> Your cart
            {count > 0 && <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold tabular-nums">{count}</span>}
          </SheetTitle>
          {items.length > 0 && hasGoods && (
            <div className="mt-4">
              <p className="flex items-center gap-2 text-sm">
                <Truck className="size-4 text-brand-700 dark:text-brand-300" aria-hidden />
                {left > 0 ? (
                  <span>
                    Add <span className="font-bold">{formatPrice(left)}</span> more for free delivery
                  </span>
                ) : (
                  <span className="font-semibold text-green-700 dark:text-green-400">You get free delivery</span>
                )}
              </p>
              <Progress value={Math.min(subtotal, FREE_DELIVERY_FROM)} max={FREE_DELIVERY_FROM} tone={left > 0 ? "brand" : "green"} className="mt-2" label="Progress to free delivery" />
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <Image src="/images/dashboard/empty-orders.png" alt="" width={180} height={180} className="size-40" />
            <h3 className="mt-3 text-lg font-bold">Your cart is empty</h3>
            <SheetDescription className="mt-1 max-w-xs text-sm text-muted-foreground">
              Lab tests, medicines, devices and rentals, all in one checkout.
            </SheetDescription>
            <Button asChild className="mt-5" onClick={() => setOpen(false)}>
              <Link href="/marketplace#catalog">
                Browse the marketplace <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <SheetDescription className="sr-only">Items in your cart</SheetDescription>
            <ul className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              <AnimatePresence initial={false}>
                {items.map((item) => {
                  const rent = rentLabel(item);
                  return (
                    <motion.li
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 40, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex gap-3 overflow-hidden rounded-2xl border border-border bg-surface p-3"
                    >
                      <Link
                        href={`/marketplace/${item.productId ?? item.id}`}
                        onClick={() => setOpen(false)}
                        className="relative size-18 shrink-0 overflow-hidden rounded-xl bg-surface-2"
                      >
                        <Image src={item.image} alt="" fill sizes="72px" className={isPortrait(item.image) ? "object-cover object-top" : "object-contain p-1.5"} />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-2 text-sm font-semibold leading-snug">{item.name}</p>
                          <button
                            type="button"
                            onClick={() => remove(item.id)}
                            aria-label={`Remove ${item.name}`}
                            className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                          </button>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {rent && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-200">{rent}</span>}
                          {item.rx && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:bg-red-950 dark:text-red-200">
                              <FileText className="size-3" aria-hidden /> Rx needed
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <Stepper size="sm" label={`Quantity of ${item.name}`} value={item.quantity} min={1} max={20} onChange={(q) => setQuantity(item.id, q)} />
                          <span className="font-display font-bold tabular-nums">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>

            <div className="space-y-3 border-t border-border bg-surface-2/60 px-5 py-4">
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="font-semibold tabular-nums">{formatPrice(subtotal)}</dd>
                </div>
                {hasGoods && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Delivery</dt>
                    <dd className={cn("font-semibold tabular-nums", fee === 0 && "text-green-700 dark:text-green-400")}>{fee === 0 ? "Free" : formatPrice(fee)}</dd>
                  </div>
                )}
              </dl>
              <p className="flex items-start gap-2 rounded-xl bg-green-50 p-3 text-xs text-green-800 dark:bg-green-950 dark:text-green-200">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
                Insurance estimate at checkout: add your card and see what your plan pays before you pay.
              </p>
              <Button asChild size="lg" className="w-full" onClick={() => setOpen(false)}>
                <Link href="/marketplace/checkout">
                  Checkout · {formatPrice(subtotal + fee)} <ArrowRight aria-hidden />
                </Link>
              </Button>
              <button type="button" onClick={() => setOpen(false)} className="w-full text-center text-sm font-semibold text-primary hover:underline">
                Continue shopping
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
