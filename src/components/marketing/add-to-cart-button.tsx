"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { productsById } from "@/data/products";
import { type CartItem } from "@/store/cart";
import { Button, type ButtonProps } from "@/components/ui/button";
import { addLineToCart } from "@/components/shop/cart-actions";

/**
 * Small "Add" button for any page. Missing product details (productId, category,
 * coverage, Rx) are filled in from the catalog when `item.id` is a product id.
 */
export function AddToCartButton({ item, label = "Add", ...props }: { item: Omit<CartItem, "quantity">; label?: string } & ButtonProps) {
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <Button
      size="sm"
      variant={added ? "soft" : "primary"}
      onClick={() => {
        const p = productsById[item.productId ?? item.id];
        addLineToCart({
          ...item,
          productId: item.productId ?? p?.id,
          category: item.category ?? p?.category,
          coverage: item.coverage ?? p?.coverage,
          rx: item.rx ?? p?.rx,
        });
        setAdded(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setAdded(false), 1600);
      }}
      aria-live="polite"
      {...props}
    >
      {added ? <Check aria-hidden /> : <Plus aria-hidden />}
      {added ? "Added" : label}
    </Button>
  );
}
