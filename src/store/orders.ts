"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { rollingDates } from "@/lib/persist";
import { DEMO_PATIENT_ID } from "@/data/patients";
import { daysFromNow, makeRef } from "@/lib/dates";

/**
 * Marketplace orders. Checkout writes here; the patient dashboard lists them;
 * the pharmacist verifies prescriptions (rx) and the lab processes test
 * orders. Seeded with other patients' orders so the staff queues look real.
 */

export type OrderStatus = "rx-review" | "placed" | "processing" | "shipped" | "delivered" | "cancelled";
export type RxStatus = "pending" | "approved" | "rejected";
export type LabStatus = "scheduled" | "collected" | "processing" | "resulted";

export interface OrderLine {
  productId: string;
  name: string;
  image: string;
  category: string;
  price: number;
  quantity: number;
  mode?: "buy" | "rent";
  rx?: boolean;
  /** Insurance share applied to this line (0–100). */
  coverage: number;
}

export interface Order {
  id: string;
  patientId: string;
  patientName: string;
  createdAt: string;
  lines: OrderLine[];
  subtotal: number;
  deliveryFee: number;
  insurancePays: number;
  total: number;
  insurerId?: string;
  claimId?: string;
  status: OrderStatus;
  address: string;
  /** Delivery or home-collection slot, free text such as "Tomorrow, 08:00–10:00". */
  slot?: string;
  payment: "card" | "cash" | "insurance-only";
  /** `note` is the pharmacist's review note; `patientNote` is what the patient wrote when uploading. */
  rx?: { fileName: string; status: RxStatus; note?: string; patientNote?: string; reviewedBy?: string; reviewedAt?: string };
  /** Present when the order contains lab tests or health packages. */
  lab?: { status: LabStatus; sampleId: string; collectedAt?: string; resultNote?: string };
}

interface OrdersState {
  orders: Order[];
  place: (order: Omit<Order, "id" | "createdAt" | "status">) => string;
  setStatus: (id: string, status: OrderStatus) => void;
  attachClaim: (id: string, claimId: string) => void;
  reviewRx: (id: string, decision: "approved" | "rejected", opts?: { note?: string; reviewedBy?: string }) => void;
  setLabStatus: (id: string, status: LabStatus, resultNote?: string) => void;
  reset: () => void;
}

const line = (productId: string, name: string, image: string, category: string, price: number, coverage = 0, extra: Partial<OrderLine> = {}): OrderLine => ({
  productId,
  name,
  image,
  category,
  price,
  quantity: 1,
  coverage,
  ...extra,
});

/** Placeholder line of a prescription uploaded from the patient portal; the pharmacist adds the medicines. */
export const RX_UPLOAD_ID = "rx-upload";

const IMG = (f: string) => `/images/marketplace/products/${f}.png`;
const RX_IMG = "/images/marketplace/categories/pharmacy.png";

function totals(lines: OrderLine[], deliveryFee = 0) {
  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const insurancePays = Math.round(lines.reduce((s, l) => s + (l.price * l.quantity * l.coverage) / 100, 0) * 100) / 100;
  return { subtotal, deliveryFee, insurancePays, total: Math.round((subtotal + deliveryFee - insurancePays) * 100) / 100 };
}

function seed(): Order[] {
  const o = (
    id: string,
    patientId: string,
    patientName: string,
    days: number,
    lines: OrderLine[],
    rest: Partial<Order> & Pick<Order, "status">,
  ): Order => ({
    id,
    patientId,
    patientName,
    createdAt: daysFromNow(days, "10:20"),
    lines,
    ...totals(lines, rest.deliveryFee ?? 0),
    address: "2400 Riverside Ave, Lakeview",
    payment: "card",
    ...rest,
  });

  return [
    o("ORD-52210", DEMO_PATIENT_ID, "Maya Robinson", -3, [line("bp-monitor", "Smart Blood Pressure Monitor", IMG("bp-monitor"), "medical-devices", 59, 50), line("pill-organizer", "Weekly Pill Organizer AM/PM", IMG("pill-organizer"), "wellness", 12)], { status: "shipped", insurerId: "northwind", claimId: "CLM-30702", slot: "Today, 14:00–18:00" }),
    o("ORD-51842", DEMO_PATIENT_ID, "Maya Robinson", -21, [line("pkg-cardiac", "Heart Health Screen", "/images/services/pkg-cardiac.png", "health-packages", 249, 60)], { status: "delivered", insurerId: "northwind", claimId: "CLM-30588", lab: { status: "resulted", sampleId: "LAB-88120", collectedAt: daysFromNow(-20, "08:10"), resultNote: "All markers in range except LDL (slightly high)." } }),
    o("ORD-50977", DEMO_PATIENT_ID, "Maya Robinson", -40, [line("vitamins", "Daily Multivitamin, 90 tablets", IMG("vitamins"), "wellness", 19), line("sunscreen", "Mineral Sunscreen SPF 50", IMG("sunscreen"), "personal-care", 16)], { status: "delivered", deliveryFee: 4.99 }),
    o("ORD-52288", "james-whitaker", "James Whitaker", 0, [line("atorvastatin", "Atorvastatin 20 mg, 30 tablets", RX_IMG, "pharmacy", 11, 90, { rx: true }), line("bp-monitor", "Smart Blood Pressure Monitor", IMG("bp-monitor"), "medical-devices", 59, 55)], { status: "rx-review", insurerId: "brightpath", rx: { fileName: "rx-whitaker-atorvastatin.pdf", status: "pending" } }),
    o("ORD-52291", "lily-tran", "Lily Tran", 0, [line("salbutamol-inhaler", "Salbutamol Inhaler 100 mcg", RX_IMG, "pharmacy", 14, 90, { rx: true }), line("nebulizer", "Quiet Compressor Nebulizer", IMG("nebulizer"), "medical-devices", 69, 80, { rx: true })], { status: "rx-review", insurerId: "orion", rx: { fileName: "lily-tran-asthma-plan.jpg", status: "pending" } }),
    o("ORD-52279", "george-okoro", "George Okoro", -1, [line("atorvastatin", "Atorvastatin 20 mg, 30 tablets", RX_IMG, "pharmacy", 11, 0, { rx: true })], { status: "rx-review", rx: { fileName: "photo-of-prescription.jpg", status: "pending" } }),
    o("ORD-52266", "zara-ali", "Zara Ali", -1, [line("amoxicillin", "Amoxicillin 500 mg, 21 capsules", RX_IMG, "pharmacy", 12, 0, { rx: true }), line("moisturizer", "Barrier Repair Moisturizer", IMG("moisturizer"), "personal-care", 18)], { status: "rx-review", rx: { fileName: "rx-zara-ali.pdf", status: "pending" } }),
    o("ORD-52240", "frank-miller", "Frank Miller", -2, [line("metformin", "Metformin 500 mg, 60 tablets", RX_IMG, "pharmacy", 8, 90, { rx: true })], { status: "processing", insurerId: "cobalt", rx: { fileName: "rx-miller-metformin.pdf", status: "approved", reviewedBy: "Kenji Mori", reviewedAt: daysFromNow(-2, "13:00") } }),
    o("ORD-52233", "chloe-martin", "Chloe Martin", -2, [line("amoxicillin", "Amoxicillin 500 mg, 21 capsules", RX_IMG, "pharmacy", 12, 0, { rx: true })], { status: "cancelled", rx: { fileName: "blurry-photo.jpg", status: "rejected", note: "Image unreadable and prescriber signature missing.", reviewedBy: "Kenji Mori", reviewedAt: daysFromNow(-2, "15:30") } }),
    o("ORD-52295", "chloe-martin", "Chloe Martin", 0, [line("test-thyroid", "Thyroid Panel (TSH, T3, T4)", "/images/services/test-thyroid.png", "lab-tests", 35, 75), line("test-cbc", "Complete Blood Count (CBC)", "/images/services/test-blood.png", "lab-tests", 19, 75)], { status: "processing", insurerId: "evergreen", slot: "Today, 08:00–10:00", lab: { status: "collected", sampleId: "LAB-88341", collectedAt: daysFromNow(0, "08:35") } }),
    o("ORD-52297", "victor-hale", "Victor Hale", 0, [line("test-cbc", "Complete Blood Count (CBC)", "/images/services/test-blood.png", "lab-tests", 19, 80)], { status: "processing", insurerId: "northwind", slot: "Ward 3C, bed 18", lab: { status: "processing", sampleId: "LAB-88356", collectedAt: daysFromNow(0, "06:50") } }),
    o("ORD-52300", "george-okoro", "George Okoro", 0, [line("test-lipid", "Lipid Profile", "/images/marketplace/categories/lab-tests.png", "lab-tests", 25), line("test-hba1c", "HbA1c", "/images/marketplace/categories/lab-tests.png", "lab-tests", 22)], { status: "placed", slot: "Tomorrow, 07:00–09:00 (fasting)", lab: { status: "scheduled", sampleId: "LAB-88370" } }),
    o("ORD-52302", "olivia-grant", "Olivia Grant", 0, [line("pkg-women", "Women's Wellness", "/images/services/pkg-women.png", "health-packages", 229, 60)], { status: "placed", insurerId: "harborline", slot: "Tomorrow, 09:00–11:00", lab: { status: "scheduled", sampleId: "LAB-88377" } }),
    o("ORD-52190", "hannah-berg", "Hannah Berg", -4, [line("pkg-full-body", "Full Body Check-up", "/images/services/pkg-full-body.png", "health-packages", 199, 60)], { status: "delivered", insurerId: "brightpath", lab: { status: "resulted", sampleId: "LAB-88012", collectedAt: daysFromNow(-4, "07:30"), resultNote: "Low hemoglobin (10.9 g/dL), oncologist informed." } }),
  ];
}

export const useOrders = create<OrdersState>()(
  persist(
    (set) => ({
      orders: seed(),
      place: (order) => {
        const id = makeRef("ORD");
        set((s) => ({
          orders: [{ ...order, id, createdAt: new Date().toISOString(), status: order.rx ? "rx-review" : "placed" }, ...s.orders],
        }));
        return id;
      },
      setStatus: (id, status) => set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)) })),
      attachClaim: (id, claimId) => set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, claimId } : o)) })),
      reviewRx: (id, decision, opts) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id && o.rx
              ? {
                  ...o,
                  status: decision === "approved" ? "processing" : "cancelled",
                  rx: { ...o.rx, status: decision, note: opts?.note, reviewedBy: opts?.reviewedBy, reviewedAt: new Date().toISOString() },
                }
              : o,
          ),
        })),
      setLabStatus: (id, status, resultNote) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id && o.lab
              ? {
                  ...o,
                  status: status === "resulted" ? "delivered" : "processing",
                  lab: {
                    ...o.lab,
                    status,
                    resultNote: resultNote ?? o.lab.resultNote,
                    collectedAt: status === "collected" ? new Date().toISOString() : o.lab.collectedAt,
                  },
                }
              : o,
          ),
        })),
      reset: () => set({ orders: seed() }),
    }),
    { name: "aurelia-orders", version: 1, storage: rollingDates() },
  ),
);
