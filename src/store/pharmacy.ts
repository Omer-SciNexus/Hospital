"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { rollingDates } from "@/lib/persist";

/**
 * Pharmacy stock changes made on /dashboard/stock. The base list lives in
 * data/finance.ts; this store keeps counted quantities, open reorders and a
 * short movement log.
 */

export interface StockMove {
  id: string;
  itemId: string;
  change: number;
  reason: string;
  at: string;
  by: string;
}

export interface Reorder {
  quantity: number;
  supplier: string;
  urgent: boolean;
  at: string;
}

interface PharmacyState {
  /** Stock overrides by stock item id. */
  stock: Record<string, number>;
  reorders: Record<string, Reorder>;
  log: StockMove[];
  adjust: (itemId: string, from: number, to: number, reason: string, by: string) => void;
  reorder: (itemId: string, order: Omit<Reorder, "at">) => void;
  /** Books a reorder in: adds the ordered quantity to stock and closes it. */
  receive: (itemId: string, current: number, by: string) => void;
  reset: () => void;
}

export const usePharmacy = create<PharmacyState>()(
  persist(
    (set) => ({
      stock: {},
      reorders: {},
      log: [],
      adjust: (itemId, from, to, reason, by) =>
        set((s) => ({
          stock: { ...s.stock, [itemId]: to },
          log: [{ id: `${itemId}-${Date.now()}`, itemId, change: to - from, reason, by, at: new Date().toISOString() }, ...s.log].slice(0, 50),
        })),
      reorder: (itemId, order) => set((s) => ({ reorders: { ...s.reorders, [itemId]: { ...order, at: new Date().toISOString() } } })),
      receive: (itemId, current, by) =>
        set((s) => {
          const open = s.reorders[itemId];
          if (!open) return s;
          const { [itemId]: _done, ...rest } = s.reorders;
          void _done;
          return {
            reorders: rest,
            stock: { ...s.stock, [itemId]: current + open.quantity },
            log: [{ id: `${itemId}-${Date.now()}`, itemId, change: open.quantity, reason: "Delivery received", by, at: new Date().toISOString() }, ...s.log].slice(0, 50),
          };
        }),
      reset: () => set({ stock: {}, reorders: {}, log: [] }),
    }),
    { name: "aurelia-pharmacy", version: 1, storage: rollingDates() },
  ),
);
