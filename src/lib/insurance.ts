import type { Insurer } from "@/data/insurers";
import type { Product } from "@/data/products";

/**
 * Share (0–100) a plan pays for a product. The product's base coverage is
 * scaled by how generous the plan is (80% is the reference) and cut for
 * partly in-network plans. Rounded to 5%.
 */
export function coverageFor(product: Pick<Product, "coverage">, insurer?: Insurer | null) {
  if (!insurer || product.coverage === 0) return 0;
  const scaled = product.coverage * (insurer.coverage / 80) * (insurer.network === "partial" ? 0.85 : 1);
  return Math.min(100, Math.round(scaled / 5) * 5);
}

export interface CostLine {
  price: number;
  quantity: number;
  coverage: number;
}

export function splitCost(lines: CostLine[]) {
  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const insurancePays = Math.round(lines.reduce((s, l) => s + (l.price * l.quantity * l.coverage) / 100, 0) * 100) / 100;
  return { subtotal, insurancePays, youPay: Math.round((subtotal - insurancePays) * 100) / 100 };
}
