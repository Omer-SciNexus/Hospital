import { FileText, House, Repeat, Sparkles, Tag } from "lucide-react";
import type { Product } from "@/data/products";
import { cn } from "@/lib/utils";
import { discountPct } from "./shop-utils";

const pill = "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold [&_svg]:size-3";

/** Deal / New / Rx flags shown on the product image. */
export function ImageBadges({ product, className }: { product: Product; className?: string }) {
  const off = discountPct(product);
  const isNew = product.tags?.includes("new");
  if (!off && !isNew && !product.rx) return null;
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {off > 0 && (
        <span className={cn(pill, "bg-coral-700 text-white")}>
          <Tag aria-hidden /> Deal −{off}%
        </span>
      )}
      {isNew && (
        <span className={cn(pill, "bg-blue-600 text-white")}>
          <Sparkles aria-hidden /> New
        </span>
      )}
      {product.rx && (
        <span className={cn(pill, "bg-red-600 text-white")} title="Prescription needed">
          <FileText aria-hidden /> Rx
        </span>
      )}
    </div>
  );
}

/** Service chips under the title: rental and home service. */
export function ServiceChips({ product, className }: { product: Product; className?: string }) {
  const home = product.tags?.includes("home-service");
  if (!product.rent && !home) return null;
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {product.rent && (
        <span className={cn(pill, "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200")}>
          <Repeat aria-hidden /> Rent from ${product.rent.weekly}/wk
        </span>
      )}
      {home && (
        <span className={cn(pill, "bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200")}>
          <House aria-hidden /> Home service
        </span>
      )}
    </div>
  );
}
