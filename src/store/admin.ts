"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { rollingDates } from "@/lib/persist";
import type { Role } from "@/config/navigation";
import { staff, type Shift, type StaffMember } from "@/data/staff";
import { products, type Product } from "@/data/products";
import { stockStatus, supplies, type StockStatus, type SupplyItem } from "@/data/operations";

/**
 * Admin console edits, layered over the mock data files: staff added or edited,
 * supply stock changes and reorders, and marketplace catalog overrides.
 * Demo only: nothing here changes the public site's data files.
 */

export type StaffEdit = Partial<Pick<StaffMember, "role" | "department" | "shift" | "title">> & { active?: boolean };
export type ProductEdit = Partial<Pick<Product, "price" | "oldPrice" | "stock" | "coverage">> & { visible?: boolean; featured?: boolean; clearOldPrice?: boolean };
export interface SupplyEdit {
  stock?: number;
  lastRestock?: string;
  /** Open purchase order waiting for delivery. */
  onOrder?: { qty: number; ref: string; placedAt: string };
}

interface AdminState {
  addedStaff: StaffMember[];
  staffEdits: Record<string, StaffEdit>;
  supplyEdits: Record<string, SupplyEdit>;
  productEdits: Record<string, ProductEdit>;
  addStaff: (member: Omit<StaffMember, "id" | "presence" | "joined">) => string;
  editStaff: (id: string, edit: StaffEdit) => void;
  adjustStock: (id: string, delta: number) => void;
  reorder: (id: string, qty: number, ref: string) => void;
  receiveOrder: (id: string) => void;
  editProduct: (id: string, edit: ProductEdit) => void;
  reset: () => void;
}

const initial = { addedStaff: [], staffEdits: {}, supplyEdits: {}, productEdits: {} };

const baseStock = (id: string) => supplies.find((s) => s.id === id)?.stock ?? 0;

export const useAdmin = create<AdminState>()(
  persist(
    (set) => ({
      ...initial,
      addStaff: (member) => {
        const id = `${member.name.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "")}-${Date.now().toString(36).slice(-4)}`;
        set((s) => ({
          addedStaff: [{ ...member, id, presence: "offline", joined: String(new Date().getFullYear()) }, ...s.addedStaff],
        }));
        return id;
      },
      editStaff: (id, edit) => set((s) => ({ staffEdits: { ...s.staffEdits, [id]: { ...s.staffEdits[id], ...edit } } })),
      adjustStock: (id, delta) =>
        set((s) => {
          const cur = s.supplyEdits[id]?.stock ?? baseStock(id);
          return { supplyEdits: { ...s.supplyEdits, [id]: { ...s.supplyEdits[id], stock: Math.max(0, cur + delta) } } };
        }),
      reorder: (id, qty, ref) =>
        set((s) => ({
          supplyEdits: { ...s.supplyEdits, [id]: { ...s.supplyEdits[id], onOrder: { qty, ref, placedAt: new Date().toISOString() } } },
        })),
      receiveOrder: (id) =>
        set((s) => {
          const e = s.supplyEdits[id];
          if (!e?.onOrder) return s;
          const cur = e.stock ?? baseStock(id);
          return {
            supplyEdits: { ...s.supplyEdits, [id]: { stock: cur + e.onOrder.qty, lastRestock: new Date().toISOString() } },
          };
        }),
      editProduct: (id, edit) => set((s) => ({ productEdits: { ...s.productEdits, [id]: { ...s.productEdits[id], ...edit } } })),
      reset: () => set(initial),
    }),
    { name: "aurelia-admin", version: 1, storage: rollingDates() },
  ),
);

/* ------------------------------------------------------------ merged views */

export interface DirectoryMember extends StaffMember {
  active: boolean;
  added?: boolean;
}

/** Staff directory with admin additions and edits applied. */
export function useStaffDirectory(): DirectoryMember[] {
  const added = useAdmin((s) => s.addedStaff);
  const edits = useAdmin((s) => s.staffEdits);
  return useMemo(
    () =>
      [...added.map((m) => ({ ...m, added: true })), ...staff].map((m) => {
        const e = edits[m.id] ?? {};
        const active = e.active ?? true;
        return {
          ...m,
          ...e,
          role: (e.role ?? m.role) as Role,
          shift: (active ? (e.shift ?? m.shift) : "Off") as Shift,
          presence: active ? m.presence : "offline",
          active,
        };
      }),
    [added, edits],
  );
}

export interface InventoryRow extends SupplyItem {
  status: StockStatus;
  value: number;
  lastRestock: string;
  onOrder?: SupplyEdit["onOrder"];
}

/** Supplies with stock edits and open orders applied. */
export function useInventory(): InventoryRow[] {
  const edits = useAdmin((s) => s.supplyEdits);
  return useMemo(
    () =>
      supplies.map((item) => {
        const e = edits[item.id] ?? {};
        const stock = e.stock ?? item.stock;
        const lastRestock = e.lastRestock ?? new Date(Date.now() - item.lastRestockDays * 86_400_000).toISOString();
        return { ...item, stock, lastRestock, onOrder: e.onOrder, status: stockStatus(stock, item.reorderLevel), value: stock * item.unitCost };
      }),
    [edits],
  );
}

export interface CatalogRow extends Product {
  visible: boolean;
  featured: boolean;
  edited: boolean;
}

/** Marketplace products with admin overrides (price, stock, coverage, visibility, featured). */
export function useCatalog(): CatalogRow[] {
  const edits = useAdmin((s) => s.productEdits);
  return useMemo(
    () =>
      products.map((p) => {
        const e = edits[p.id];
        if (!e) return { ...p, visible: true, featured: !!p.tags?.includes("bestseller"), edited: false };
        const { visible, featured, clearOldPrice, ...rest } = e;
        return {
          ...p,
          ...rest,
          oldPrice: clearOldPrice ? undefined : (rest.oldPrice ?? p.oldPrice),
          visible: visible ?? true,
          featured: featured ?? !!p.tags?.includes("bestseller"),
          edited: true,
        };
      }),
    [edits],
  );
}
