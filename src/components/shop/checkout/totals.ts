import type { Insurer } from "@/data/insurers";
import { coverageFor, splitCost } from "@/lib/insurance";
import type { CartItem } from "@/store/cart";
import { deliveryFeeFor, productOf, round2 } from "../shop-utils";

export interface PricedLine extends CartItem {
  /** Share the selected plan pays for this line (0–100). */
  share: number;
  insurerPart: number;
}

/** Applies the chosen plan to every cart line and adds delivery. */
export function computeTotals(items: CartItem[], insurer?: Insurer | null) {
  const lines: PricedLine[] = items.map((i) => {
    const share = coverageFor({ coverage: i.coverage ?? productOf(i)?.coverage ?? 0 }, insurer);
    return { ...i, share, insurerPart: round2((i.price * i.quantity * share) / 100) };
  });
  const { subtotal, insurancePays } = splitCost(lines.map((l) => ({ price: l.price, quantity: l.quantity, coverage: l.share })));
  const fee = deliveryFeeFor(items);
  return { lines, subtotal, fee, insurancePays, total: round2(subtotal + fee - insurancePays) };
}

export const isLab = (i: Pick<CartItem, "category">) => i.category === "lab-tests" || i.category === "health-packages";
export const isVideo = (i: Pick<CartItem, "category">) => i.category === "consultations";
