"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const COMPARE_LIMIT = 4;

interface ShopState {
  wishlist: string[];
  compare: string[];
  recentlyViewed: string[];
  toggleWishlist: (id: string) => void;
  /** Returns false when the compare tray is full. */
  toggleCompare: (id: string) => boolean;
  clearCompare: () => void;
  viewed: (id: string) => void;
}

/** Wishlist, compare tray and recently viewed products. Product ids only. */
export const useShop = create<ShopState>()(
  persist(
    (set, get) => ({
      wishlist: [],
      compare: [],
      recentlyViewed: [],
      toggleWishlist: (id) =>
        set((s) => ({ wishlist: s.wishlist.includes(id) ? s.wishlist.filter((x) => x !== id) : [...s.wishlist, id] })),
      toggleCompare: (id) => {
        const { compare } = get();
        if (compare.includes(id)) {
          set({ compare: compare.filter((x) => x !== id) });
          return true;
        }
        if (compare.length >= COMPARE_LIMIT) return false;
        set({ compare: [...compare, id] });
        return true;
      },
      clearCompare: () => set({ compare: [] }),
      viewed: (id) => set((s) => ({ recentlyViewed: [id, ...s.recentlyViewed.filter((x) => x !== id)].slice(0, 8) })),
    }),
    { name: "aurelia-shop" },
  ),
);
