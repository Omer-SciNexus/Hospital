"use client";

import { toast } from "sonner";
import type { Product } from "@/data/products";
import { useCart, type CartItem } from "@/store/cart";
import { useShop } from "@/store/shop";
import { cartItemFor } from "./shop-utils";

/** Every "add" shows the same toast with a "View cart" action that opens the cart drawer. */
export function notifyAdded(name: string, quantity = 1) {
  toast.success(quantity > 1 ? `${quantity} × ${name} added to cart` : `${name} added to cart`, {
    action: { label: "View cart", onClick: () => useCart.getState().setOpen(true) },
  });
}

export function addLineToCart(item: Omit<CartItem, "quantity">, quantity = 1) {
  useCart.getState().add(item, quantity);
  notifyAdded(item.name, quantity);
}

export function addProductToCart(p: Product, opts: { mode?: "buy" | "rent"; weeks?: number; quantity?: number } = {}) {
  addLineToCart(cartItemFor(p, opts.mode, opts.weeks), opts.quantity ?? 1);
}

export function toggleCompareWithToast(p: Pick<Product, "id" | "name">) {
  const { compare, toggleCompare } = useShop.getState();
  const removing = compare.includes(p.id);
  if (!toggleCompare(p.id)) {
    toast.error("You can compare up to 4 items", { description: "Remove one from the compare tray first." });
    return;
  }
  if (removing) toast(`${p.name} removed from compare`);
  else
    toast.success(`${p.name} added to compare`, {
      action: { label: "Compare", onClick: () => window.location.assign("/marketplace/compare") },
    });
}

export function toggleWishlistWithToast(p: Pick<Product, "id" | "name">) {
  const { wishlist, toggleWishlist } = useShop.getState();
  const removing = wishlist.includes(p.id);
  toggleWishlist(p.id);
  toast.success(removing ? `Removed from your wishlist` : `Saved to your wishlist`, { description: p.name });
}
