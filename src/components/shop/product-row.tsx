import type { Product } from "@/data/products";
import { cn } from "@/lib/utils";
import { ProductCard } from "./product-card";

/** Horizontal, swipeable row of product cards. With `grid` it becomes a 4-column grid on large screens. */
export function ProductRow({ products, grid, className }: { products: Product[]; grid?: boolean; className?: string }) {
  return (
    <ul
      className={cn(
        "scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6",
        grid && "lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0",
        className,
      )}
    >
      {products.map((p) => (
        <li key={p.id} className={cn("w-[220px] shrink-0 snap-start sm:w-[250px]", grid && "lg:w-auto")}>
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
}
