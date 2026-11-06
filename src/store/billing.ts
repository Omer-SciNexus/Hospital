"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { rollingDates } from "@/lib/persist";

/** Invoice payments and reminders recorded on /dashboard/invoices. */

interface BillingState {
  /** Invoice id → ISO date it was marked paid. */
  paid: Record<string, string>;
  reminders: Record<string, { count: number; lastAt: string }>;
  markPaid: (id: string) => void;
  sendReminder: (id: string) => void;
  reset: () => void;
}

export const useBilling = create<BillingState>()(
  persist(
    (set) => ({
      paid: {},
      reminders: {},
      markPaid: (id) => set((s) => ({ paid: { ...s.paid, [id]: new Date().toISOString() } })),
      sendReminder: (id) =>
        set((s) => ({
          reminders: { ...s.reminders, [id]: { count: (s.reminders[id]?.count ?? 0) + 1, lastAt: new Date().toISOString() } },
        })),
      reset: () => set({ paid: {}, reminders: {} }),
    }),
    { name: "aurelia-billing", version: 1, storage: rollingDates() },
  ),
);
