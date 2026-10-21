import { insurers } from "@/data/insurers";
import { isService, productsById, type Product } from "@/data/products";
import { coverageFor } from "@/lib/insurance";
import type { CartItem } from "@/store/cart";

/** Free delivery from this subtotal; below it a flat fee applies. */
export const FREE_DELIVERY_FROM = 50;
export const DELIVERY_FEE = 4.99;

export const discountPct = (p: Pick<Product, "price" | "oldPrice">) =>
  p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;

/** Best share any accepted plan would pay ("Insurance may pay up to X%"). */
export const maxCoverage = (p: Pick<Product, "coverage">) => Math.max(0, ...insurers.map((i) => coverageFor(p, i)));

/** Product images that are portraits (doctors) fill the frame; the rest are 3D objects on a soft background. */
export const isPortrait = (src: string) => src.startsWith("/images/doctors/");

export const priceFor = (p: Product, mode: "buy" | "rent", weeks: number) =>
  mode === "rent" && p.rent ? p.rent.weekly * weeks + p.rent.deposit : p.price;

/** Builds the cart line for a product. Rentals encode the weeks in the line id: `${id}:rent-4w`. */
export function cartItemFor(p: Product, mode: "buy" | "rent" = "buy", weeks = 1): Omit<CartItem, "quantity"> {
  const rent = mode === "rent" && !!p.rent;
  return {
    id: rent ? `${p.id}:rent-${weeks}w` : p.id,
    productId: p.id,
    name: p.name,
    image: p.image,
    price: priceFor(p, rent ? "rent" : "buy", weeks),
    mode: rent ? "rent" : "buy",
    rx: p.rx,
    category: p.category,
    coverage: p.coverage,
  };
}

/** Weeks of a rental cart line (from its id), or 0 for a purchase. */
export function rentWeeks(item: Pick<CartItem, "id" | "mode">) {
  if (item.mode !== "rent") return 0;
  return Number(item.id.match(/:rent-(\d+)w$/)?.[1] ?? 1);
}

export function productOf(item: Pick<CartItem, "id" | "productId">): Product | undefined {
  return productsById[item.productId ?? item.id.split(":")[0]];
}

export function rentLabel(item: Pick<CartItem, "id" | "mode" | "productId">) {
  const weeks = rentWeeks(item);
  const p = productOf(item);
  if (!weeks || !p?.rent) return null;
  return `Rent · ${weeks} ${weeks === 1 ? "week" : "weeks"} · $${p.rent.weekly}/wk + $${p.rent.deposit} deposit`;
}

/** True for shipped goods (not lab tests, packages or video visits). */
export const isPhysical = (item: Pick<CartItem, "category">) => !item.category || !isService({ category: item.category as Product["category"] });

export function deliveryFeeFor(items: Pick<CartItem, "category" | "price" | "quantity">[]) {
  if (!items.some(isPhysical)) return 0;
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  return subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
}

export const round2 = (n: number) => Math.round(n * 100) / 100;
