import Image from "next/image";
import type { Product } from "@/data/products";
import { cn } from "@/lib/utils";
import { isPortrait } from "./shop-utils";

/** Product photo on a soft tinted tile. Doctor portraits fill the frame, objects float with padding. */
export function ProductImage({
  product,
  sizes,
  priority,
  className,
  imgClassName,
}: {
  product: Pick<Product, "image" | "name">;
  sizes: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
}) {
  const portrait = isPortrait(product.image);
  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-br from-surface-2 to-muted/60", className)}>
      <Image
        src={product.image}
        alt={product.name}
        fill
        sizes={sizes}
        priority={priority}
        className={cn(portrait ? "object-cover object-top" : "object-contain p-[10%]", imgClassName)}
      />
    </div>
  );
}
