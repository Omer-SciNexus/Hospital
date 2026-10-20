"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  /** Cart line id. Rentals use `${productId}:rent` so buy and rent can sit side by side. */
  id: string;
  productId?: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  mode?: "buy" | "rent";
  /** Needs a prescription at checkout. */
  rx?: boolean;
  category?: string;
  /** Base insurance coverage of the product (0–100), see lib/insurance.ts. */
  coverage?: number;
}

interface CartState {
  items: CartItem[];
  /** Cart drawer visibility (not persisted). */
  open: boolean;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  remove: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  setOpen: (open: boolean) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      open: false,
      add: (item, quantity = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.id === item.id);
          if (existing) {
            return { items: s.items.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i)) };
          }
          return { items: [...s.items, { ...item, quantity }] };
        }),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      setQuantity: (id, quantity) =>
        set((s) => ({
          items: quantity <= 0 ? s.items.filter((i) => i.id !== id) : s.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        })),
      setOpen: (open) => set({ open }),
      clear: () => set({ items: [] }),
    }),
    { name: "aurelia-cart", partialize: (s) => ({ items: s.items }) },
  ),
);

export const selectCartCount = (s: CartState) => s.items.reduce((n, i) => n + i.quantity, 0);
export const selectCartSubtotal = (s: CartState) => s.items.reduce((n, i) => n + i.price * i.quantity, 0);
