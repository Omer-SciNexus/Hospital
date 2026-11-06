/**
 * Pharmacy stock and billing data for the pharmacist and billing dashboards.
 * Dates are relative to today so expiry warnings and invoice aging stay live.
 * All suppliers, batches and amounts are made up.
 */

import { daysFromNow } from "@/lib/dates";

/* ------------------------------------------------------------------ stock */

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export interface StockItem {
  id: string;
  name: string;
  form: "Tablet" | "Capsule" | "Syrup" | "Inhaler" | "Injection" | "Infusion" | "Nebule" | "Pen";
  group: string;
  batch: string;
  /** ISO date. */
  expiry: string;
  stock: number;
  reorderLevel: number;
  /** "packs", "vials"… */
  unit: string;
  unitCost: number;
  shelf: string;
  supplier: string;
  rx: boolean;
  controlled?: boolean;
  /** Marketplace product this stock line feeds, if any. */
  productId?: string;
}

const s = (item: Omit<StockItem, "expiry"> & { expiresInDays: number }): StockItem => {
  const { expiresInDays, ...rest } = item;
  return { ...rest, expiry: daysFromNow(expiresInDays) };
};

export const suppliers = ["Medline Distribution Co.", "Bluebird Pharma Supply", "Harbor Wholesale Drugs", "Crescent Generics"] as const;

export const stockItems: StockItem[] = [
  s({ id: "stk-paracetamol", name: "Paracetamol 500 mg, 24 tablets", form: "Tablet", group: "Pain relief", batch: "PC-24117", expiresInDays: 410, stock: 386, reorderLevel: 120, unit: "packs", unitCost: 1.8, shelf: "A-01", supplier: suppliers[0], rx: false, productId: "pain-relief" }),
  s({ id: "stk-ibuprofen", name: "Ibuprofen 400 mg, 30 tablets", form: "Tablet", group: "Pain relief", batch: "IB-88021", expiresInDays: 44, stock: 64, reorderLevel: 60, unit: "packs", unitCost: 2.4, shelf: "A-02", supplier: suppliers[0], rx: false }),
  s({ id: "stk-aspirin", name: "Aspirin 81 mg, 30 tablets", form: "Tablet", group: "Cardiac", batch: "AS-10933", expiresInDays: 290, stock: 140, reorderLevel: 50, unit: "packs", unitCost: 1.5, shelf: "B-01", supplier: suppliers[3], rx: false }),
  s({ id: "stk-cough", name: "Honey & Thyme Cough Syrup 150 mL", form: "Syrup", group: "Respiratory", batch: "CS-55102", expiresInDays: 26, stock: 172, reorderLevel: 40, unit: "bottles", unitCost: 3.1, shelf: "C-04", supplier: suppliers[1], rx: false, productId: "cough-syrup" }),
  s({ id: "stk-amoxicillin", name: "Amoxicillin 500 mg, 21 capsules", form: "Capsule", group: "Antibiotic", batch: "AM-40218", expiresInDays: 180, stock: 18, reorderLevel: 40, unit: "packs", unitCost: 3.6, shelf: "D-01", supplier: suppliers[3], rx: true, productId: "amoxicillin" }),
  s({ id: "stk-clarithromycin", name: "Clarithromycin 500 mg, 14 tablets", form: "Tablet", group: "Antibiotic", batch: "CL-30871", expiresInDays: 330, stock: 46, reorderLevel: 20, unit: "packs", unitCost: 6.9, shelf: "D-02", supplier: suppliers[3], rx: true }),
  s({ id: "stk-ceftriaxone", name: "Ceftriaxone 1 g vial", form: "Injection", group: "Antibiotic", batch: "CF-77310", expiresInDays: 52, stock: 0, reorderLevel: 30, unit: "vials", unitCost: 4.2, shelf: "F-02", supplier: suppliers[1], rx: true }),
  s({ id: "stk-metformin", name: "Metformin 500 mg, 60 tablets", form: "Tablet", group: "Diabetes", batch: "MF-12094", expiresInDays: 520, stock: 296, reorderLevel: 80, unit: "packs", unitCost: 2.1, shelf: "B-05", supplier: suppliers[3], rx: true, productId: "metformin" }),
  s({ id: "stk-insulin", name: "Insulin glargine 100 U/mL pen", form: "Pen", group: "Diabetes", batch: "IG-60512", expiresInDays: 75, stock: 22, reorderLevel: 25, unit: "pens", unitCost: 18.5, shelf: "Fridge 1", supplier: suppliers[1], rx: true }),
  s({ id: "stk-atorvastatin", name: "Atorvastatin 20 mg, 30 tablets", form: "Tablet", group: "Cardiac", batch: "AT-90344", expiresInDays: 610, stock: 231, reorderLevel: 70, unit: "packs", unitCost: 2.7, shelf: "B-02", supplier: suppliers[0], rx: true, productId: "atorvastatin" }),
  s({ id: "stk-amlodipine", name: "Amlodipine 5 mg, 28 tablets", form: "Tablet", group: "Cardiac", batch: "AL-21877", expiresInDays: 400, stock: 118, reorderLevel: 50, unit: "packs", unitCost: 1.9, shelf: "B-03", supplier: suppliers[0], rx: true }),
  s({ id: "stk-bisoprolol", name: "Bisoprolol 5 mg, 28 tablets", form: "Tablet", group: "Cardiac", batch: "BS-33019", expiresInDays: 365, stock: 34, reorderLevel: 40, unit: "packs", unitCost: 2.2, shelf: "B-04", supplier: suppliers[3], rx: true }),
  s({ id: "stk-furosemide", name: "Furosemide 40 mg, 28 tablets", form: "Tablet", group: "Cardiac", batch: "FU-50610", expiresInDays: 240, stock: 88, reorderLevel: 30, unit: "packs", unitCost: 1.4, shelf: "B-06", supplier: suppliers[0], rx: true }),
  s({ id: "stk-enoxaparin", name: "Enoxaparin 40 mg syringe", form: "Injection", group: "Blood thinner", batch: "EN-71205", expiresInDays: 18, stock: 54, reorderLevel: 60, unit: "syringes", unitCost: 7.8, shelf: "F-04", supplier: suppliers[1], rx: true }),
  s({ id: "stk-heparin", name: "Heparin 5,000 IU/mL vial", form: "Injection", group: "Blood thinner", batch: "HP-48821", expiresInDays: 210, stock: 70, reorderLevel: 30, unit: "vials", unitCost: 5.5, shelf: "F-05", supplier: suppliers[1], rx: true }),
  s({ id: "stk-salbutamol", name: "Salbutamol Inhaler 100 mcg", form: "Inhaler", group: "Respiratory", batch: "SB-26014", expiresInDays: 300, stock: 12, reorderLevel: 30, unit: "inhalers", unitCost: 4.9, shelf: "C-01", supplier: suppliers[0], rx: true, productId: "salbutamol-inhaler" }),
  s({ id: "stk-salbutamol-neb", name: "Salbutamol nebules 2.5 mg, 20", form: "Nebule", group: "Respiratory", batch: "SN-26190", expiresInDays: 120, stock: 41, reorderLevel: 20, unit: "boxes", unitCost: 3.8, shelf: "C-02", supplier: suppliers[0], rx: true }),
  s({ id: "stk-prednisolone", name: "Prednisolone 5 mg, 28 tablets", form: "Tablet", group: "Respiratory", batch: "PR-14472", expiresInDays: 39, stock: 26, reorderLevel: 20, unit: "packs", unitCost: 2.6, shelf: "C-03", supplier: suppliers[3], rx: true }),
  s({ id: "stk-omeprazole", name: "Omeprazole 20 mg, 28 capsules", form: "Capsule", group: "Stomach", batch: "OM-61123", expiresInDays: 470, stock: 160, reorderLevel: 50, unit: "packs", unitCost: 1.7, shelf: "E-01", supplier: suppliers[3], rx: false }),
  s({ id: "stk-ondansetron", name: "Ondansetron 4 mg, 10 tablets", form: "Tablet", group: "Stomach", batch: "ON-58810", expiresInDays: 260, stock: 0, reorderLevel: 25, unit: "packs", unitCost: 4.4, shelf: "E-02", supplier: suppliers[1], rx: true }),
  s({ id: "stk-levothyroxine", name: "Levothyroxine 50 mcg, 28 tablets", form: "Tablet", group: "Hormones", batch: "LV-40097", expiresInDays: 350, stock: 93, reorderLevel: 30, unit: "packs", unitCost: 1.6, shelf: "B-07", supplier: suppliers[3], rx: true }),
  s({ id: "stk-sertraline", name: "Sertraline 50 mg, 28 tablets", form: "Tablet", group: "Mental health", batch: "SE-77402", expiresInDays: 430, stock: 67, reorderLevel: 25, unit: "packs", unitCost: 2.3, shelf: "B-08", supplier: suppliers[0], rx: true }),
  s({ id: "stk-cetirizine", name: "Cetirizine 10 mg, 30 tablets", form: "Tablet", group: "Allergy", batch: "CT-31520", expiresInDays: 55, stock: 210, reorderLevel: 60, unit: "packs", unitCost: 1.2, shelf: "A-05", supplier: suppliers[3], rx: false }),
  s({ id: "stk-morphine", name: "Morphine 10 mg/mL ampoule", form: "Injection", group: "Pain relief", batch: "MO-90011", expiresInDays: 190, stock: 28, reorderLevel: 20, unit: "ampoules", unitCost: 3.9, shelf: "CD safe", supplier: suppliers[1], rx: true, controlled: true }),
  s({ id: "stk-saline", name: "Sodium chloride 0.9% 500 mL", form: "Infusion", group: "Fluids", batch: "NS-20456", expiresInDays: 700, stock: 340, reorderLevel: 150, unit: "bags", unitCost: 1.1, shelf: "G-01", supplier: suppliers[2], rx: true }),
  s({ id: "stk-vitamin-d", name: "Vitamin D3 1,000 IU, 90 tablets", form: "Tablet", group: "Supplements", batch: "VD-11873", expiresInDays: 540, stock: 25, reorderLevel: 30, unit: "packs", unitCost: 2.9, shelf: "A-07", supplier: suppliers[2], rx: false }),
];

export function stockStatus(stock: number, reorderLevel: number): StockStatus {
  if (stock <= 0) return "out-of-stock";
  if (stock <= reorderLevel) return "low-stock";
  return "in-stock";
}

/** Days until a date (negative when it has passed). */
export function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

/** Prescriptions verified and rejected per day over the last 7 days (made up). */
export const rxPerDay = [14, 19, 11, 22, 17, 9, 15].map((verified, i) => ({
  day: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(new Date(daysFromNow(i - 6))),
  verified,
  rejected: [2, 1, 3, 2, 1, 0, 1][i],
}));

/* --------------------------------------------------------------- invoices */

export type InvoiceStatus = "paid" | "unpaid" | "overdue";

export interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  description: string;
  issuedAt: string;
  dueAt: string;
  insurerId?: string;
  total: number;
  insurancePart: number;
  patientPart: number;
  paidAt?: string;
  /** Set for invoices made from marketplace orders. */
  orderId?: string;
}

const inv = (
  id: string,
  patientId: string,
  patientName: string,
  description: string,
  issuedDaysAgo: number,
  total: number,
  insurancePart: number,
  extra: Partial<Invoice> = {},
): Invoice => ({
  id,
  patientId,
  patientName,
  description,
  issuedAt: daysFromNow(-issuedDaysAgo, "09:30"),
  dueAt: daysFromNow(30 - issuedDaysAgo, "23:59"),
  total,
  insurancePart,
  patientPart: Math.round((total - insurancePart) * 100) / 100,
  ...extra,
});

export const invoices: Invoice[] = [
  inv("INV-24018", "rosa-delgado", "Rosa Delgado", "Coronary stent and 3-day stay", 3, 18400, 15640, { insurerId: "harborline" }),
  inv("INV-24011", "victor-hale", "Victor Hale", "Knee replacement, surgical ward", 9, 24500, 19600, { insurerId: "northwind" }),
  inv("INV-24006", "samuel-reyes", "Samuel Reyes", "Emergency appendectomy", 1, 8600, 6450, { insurerId: "atlas" }),
  inv("INV-23988", "olivia-grant", "Olivia Grant", "Delivery and maternity stay", 2, 9100, 7735, { insurerId: "harborline" }),
  inv("INV-23940", "george-okoro", "George Okoro", "Lipid profile + cardiology consult", 18, 145, 0, { insurerId: "solace" }),
  inv("INV-23902", "zara-ali", "Zara Ali", "Dermatology review and patch test", 26, 260, 0),
  inv("INV-23861", "james-whitaker", "James Whitaker", "Cardiac ward stay, 2 nights", 38, 3900, 3510, { insurerId: "brightpath" }),
  inv("INV-23820", "chloe-martin", "Chloe Martin", "Holter monitor, 48 hours", 47, 320, 240, { insurerId: "evergreen" }),
  inv("INV-23777", "peter-novak", "Peter Novak", "CT head and stroke workup", 56, 2150, 1935, { insurerId: "brightpath" }),
  inv("INV-23712", "lily-tran", "Lily Tran", "Pediatric ER visit, nebulizer", 70, 410, 328, { insurerId: "orion" }),
  inv("INV-23655", "ahmed-saleh", "Ahmed Saleh", "Echocardiogram", 84, 680, 544, { insurerId: "cobalt" }),
  inv("INV-23590", "frank-miller", "Frank Miller", "Chest X-ray and follow-up", 105, 290, 232, { insurerId: "cobalt" }),
  inv("INV-23511", "zara-ali", "Zara Ali", "Laser skin treatment (self-pay)", 132, 950, 0),
  inv("INV-23970", "maya-robinson", "Maya Robinson", "Cardiology visit, Dr. Layla Haddad", 12, 120, 96, { insurerId: "northwind", paidAt: daysFromNow(0, "08:40") }),
  inv("INV-23932", "hannah-berg", "Hannah Berg", "Chemotherapy cycle 2", 22, 6200, 5580, { insurerId: "brightpath", paidAt: daysFromNow(0, "07:55") }),
  inv("INV-23874", "frank-miller", "Frank Miller", "Inpatient stay, pneumonia", 35, 7800, 6240, { insurerId: "cobalt", paidAt: daysFromNow(-12) }),
  inv("INV-23801", "rosa-delgado", "Rosa Delgado", "Cardiology consult and ECG", 50, 210, 178.5, { insurerId: "harborline", paidAt: daysFromNow(-30) }),
];

export function invoiceStatus(invoice: Pick<Invoice, "dueAt">, paidAt?: string): InvoiceStatus {
  if (paidAt) return "paid";
  return new Date(invoice.dueAt).getTime() < Date.now() ? "overdue" : "unpaid";
}

/* ------------------------------------------------------------ payer stats */

/** How fast and how often each insurer pays, last 90 days (made up). */
export const payerStats: { insurerId: string; avgDaysToPay: number; approvalRate: number; claims: number }[] = [
  { insurerId: "northwind", avgDaysToPay: 9, approvalRate: 91, claims: 148 },
  { insurerId: "harborline", avgDaysToPay: 7, approvalRate: 94, claims: 96 },
  { insurerId: "brightpath", avgDaysToPay: 12, approvalRate: 88, claims: 121 },
  { insurerId: "cobalt", avgDaysToPay: 14, approvalRate: 86, claims: 73 },
  { insurerId: "evergreen", avgDaysToPay: 11, approvalRate: 89, claims: 54 },
  { insurerId: "solace", avgDaysToPay: 23, approvalRate: 71, claims: 31 },
  { insurerId: "orion", avgDaysToPay: 16, approvalRate: 84, claims: 40 },
  { insurerId: "pinecrest", avgDaysToPay: 19, approvalRate: 76, claims: 22 },
];
