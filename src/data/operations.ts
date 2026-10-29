/**
 * Made-up hospital operations data for the admin dashboard: daily time series,
 * department stats, beds, ER, revenue, satisfaction, payer mix and supplies.
 * Numbers are deterministic (seeded by calendar date) so they stay stable on
 * reload and line up with site.ts (620 beds, 29 departments, 340+ specialists).
 */

import { departmentGroups, departments, getDepartment, type DepartmentGroupId, type MarketplaceCategoryId } from "@/config/departments";
import { marketplaceCategories } from "@/config/marketplace";
import { insurers } from "./insurers";

export const HOSPITAL = { beds: 620, departments: 29, specialists: 340 } as const;

/* ------------------------------------------------------------------ helpers */

const DAY = 86_400_000;

/** Small deterministic noise in [0, 1) from two integers. */
function noise(a: number, b = 0) {
  let t = (a * 2654435761 + b * 1597334677) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Days since epoch (local), used as a stable seed per calendar day. */
const dayKey = (d: Date) => Math.floor((d.getTime() - d.getTimezoneOffset() * 60_000) / DAY);

const round = (n: number, step = 1) => Math.round(n / step) * step;

export function deptName(slug: string) {
  return getDepartment(slug)?.name ?? slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
}

/* --------------------------------------------------------------- daily data */

export const revenueStreams = [
  { key: "inpatient", label: "Inpatient" },
  { key: "outpatient", label: "Outpatient" },
  { key: "pharmacy", label: "Pharmacy" },
  { key: "lab", label: "Lab" },
  { key: "marketplace", label: "Marketplace" },
] as const;

export type StreamKey = (typeof revenueStreams)[number]["key"];

export interface DayStats {
  date: Date;
  visits: number;
  admissions: number;
  discharges: number;
  erVisits: number;
  /** Average ER door-to-doctor wait in minutes. */
  erWait: number;
  satisfaction: number;
  inpatient: number;
  outpatient: number;
  pharmacy: number;
  lab: number;
  marketplace: number;
}

/** Stats for one calendar day. `offset` is days from today (0 = today, -1 = yesterday). */
export function dayStats(offset: number): DayStats {
  const date = new Date(startOfDay().getTime() + offset * DAY);
  const k = dayKey(date);
  const dow = date.getDay();
  const week = dow === 0 ? 0.7 : dow === 6 ? 0.78 : dow === 1 ? 1.08 : 1;
  const season = 1 + 0.07 * Math.cos(((date.getMonth() - 0.5) / 12) * Math.PI * 2);
  const trend = 1 + 0.00035 * offset;
  const n = (s: number, spread: number) => 1 + spread * (noise(k, s) - 0.5);
  const base = week * season * trend;

  return {
    date,
    visits: round(2650 * base * n(1, 0.1)),
    admissions: round(86 * (0.85 + 0.15 * week) * season * n(2, 0.2)),
    discharges: round(84 * (0.8 + 0.2 * week) * season * n(3, 0.22)),
    erVisits: round(182 * season * (dow === 0 || dow === 6 ? 1.1 : 1) * n(4, 0.18)),
    erWait: Math.round(25 * season * n(5, 0.3) * 10) / 10,
    satisfaction: Math.round((4.68 + 0.18 * (noise(k, 6) - 0.5)) * 100) / 100,
    inpatient: round(690_000 * season * trend * n(7, 0.12), 100),
    outpatient: round(270_000 * base * n(8, 0.14), 100),
    pharmacy: round(140_000 * base * n(9, 0.12), 100),
    lab: round(160_000 * base * n(10, 0.14), 100),
    marketplace: round(21_000 * (dow === 0 || dow === 6 ? 1.15 : 1) * trend * n(11, 0.25), 10),
  };
}

export const revenueOf = (d: Pick<DayStats, StreamKey>) => d.inpatient + d.outpatient + d.pharmacy + d.lab + d.marketplace;

/** The last `days` days, oldest first, ending today. */
export function lastDays(days: number) {
  return Array.from({ length: days }, (_, i) => dayStats(i - days + 1));
}

/* ------------------------------------------------------------ range buckets */

export type RangeId = "7d" | "30d" | "90d" | "12m";

export const ranges: { id: RangeId; label: string; days: number; bucket: number; long: string }[] = [
  { id: "7d", label: "7 days", days: 7, bucket: 1, long: "last 7 days" },
  { id: "30d", label: "30 days", days: 30, bucket: 1, long: "last 30 days" },
  { id: "90d", label: "90 days", days: 91, bucket: 7, long: "last 90 days" },
  { id: "12m", label: "12 months", days: 360, bucket: 30, long: "last 12 months" },
];

export interface Bucket extends Omit<DayStats, "date"> {
  label: string;
  revenue: number;
  /** Same metric for the matching bucket in the previous period. */
  prevVisits: number;
}

function sumDays(days: DayStats[]): Omit<DayStats, "date"> {
  const s = days.reduce(
    (a, d) => ({
      visits: a.visits + d.visits,
      admissions: a.admissions + d.admissions,
      discharges: a.discharges + d.discharges,
      erVisits: a.erVisits + d.erVisits,
      erWait: a.erWait + d.erWait,
      satisfaction: a.satisfaction + d.satisfaction,
      inpatient: a.inpatient + d.inpatient,
      outpatient: a.outpatient + d.outpatient,
      pharmacy: a.pharmacy + d.pharmacy,
      lab: a.lab + d.lab,
      marketplace: a.marketplace + d.marketplace,
    }),
    { visits: 0, admissions: 0, discharges: 0, erVisits: 0, erWait: 0, satisfaction: 0, inpatient: 0, outpatient: 0, pharmacy: 0, lab: 0, marketplace: 0 },
  );
  return { ...s, erWait: Math.round((s.erWait / days.length) * 10) / 10, satisfaction: Math.round((s.satisfaction / days.length) * 100) / 100 };
}

const fmtDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const fmtWeekday = new Intl.DateTimeFormat("en-US", { weekday: "short", day: "numeric" });
const fmtMonth = new Intl.DateTimeFormat("en-US", { month: "short" });

/** Chart buckets for a range (daily, weekly or 30-day), oldest first, with previous-period visits. */
export function rangeSeries(id: RangeId): Bucket[] {
  const r = ranges.find((x) => x.id === id)!;
  const count = r.days / r.bucket;
  return Array.from({ length: count }, (_, i) => {
    const endOffset = -(count - 1 - i) * r.bucket;
    const days = Array.from({ length: r.bucket }, (_, j) => dayStats(endOffset - j));
    const prev = Array.from({ length: r.bucket }, (_, j) => dayStats(endOffset - j - r.days));
    const s = sumDays(days);
    const end = days[0].date;
    const label = r.bucket === 1 ? (id === "7d" ? fmtWeekday.format(end) : fmtDay.format(end)) : r.bucket === 7 ? fmtDay.format(days.at(-1)!.date) : fmtMonth.format(end);
    return { ...s, label, revenue: revenueOf(s), prevVisits: prev.reduce((a, d) => a + d.visits, 0) };
  });
}

export interface RangeTotals extends Omit<DayStats, "date"> {
  revenue: number;
}

/** Totals for the whole range and the period before it. */
export function rangeTotals(id: RangeId): { current: RangeTotals; previous: RangeTotals } {
  const r = ranges.find((x) => x.id === id)!;
  const cur = sumDays(Array.from({ length: r.days }, (_, i) => dayStats(-i)));
  const prev = sumDays(Array.from({ length: r.days }, (_, i) => dayStats(-i - r.days)));
  return { current: { ...cur, revenue: revenueOf(cur) }, previous: { ...prev, revenue: revenueOf(prev) } };
}

/** Signed percent change, one decimal. */
export function pctChange(current: number, previous: number) {
  if (!previous) return 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/* ------------------------------------------------------------- departments */

export type DeptStatus = "open" | "busy" | "full";

export interface DepartmentStat {
  slug: string;
  name: string;
  group: DepartmentGroupId;
  beds: number;
  occupied: number;
  patientsToday: number;
  waitMin: number;
  satisfaction: number;
  /** Average revenue per day in USD. */
  revenueDay: number;
  status: DeptStatus;
}

// slug: [beds, occupied, patients today, wait min, satisfaction, revenue per day]
const deptRaw: Record<string, [number, number, number, number, number, number]> = {
  emergency: [40, 37, 186, 24, 4.5, 68000],
  icu: [36, 33, 36, 0, 4.8, 92000],
  anesthesiology: [12, 8, 54, 15, 4.7, 31000],
  "internal-medicine": [60, 52, 142, 18, 4.7, 54000],
  cardiology: [48, 44, 118, 21, 4.8, 88000],
  neurology: [30, 26, 64, 26, 4.7, 47000],
  pulmonology: [24, 20, 58, 19, 4.6, 29000],
  gastroenterology: [22, 18, 61, 22, 4.6, 36000],
  nephrology: [20, 19, 48, 12, 4.7, 41000],
  endocrinology: [10, 6, 72, 17, 4.8, 21000],
  oncology: [34, 31, 77, 14, 4.9, 96000],
  "general-surgery": [44, 39, 52, 28, 4.6, 74000],
  orthopedics: [40, 35, 96, 31, 4.7, 69000],
  neurosurgery: [18, 16, 14, 20, 4.8, 58000],
  urology: [16, 12, 44, 16, 4.6, 26000],
  "plastic-surgery": [10, 6, 22, 12, 4.8, 24000],
  "obstetrics-gynecology": [42, 38, 88, 20, 4.9, 61000],
  pediatrics: [36, 30, 124, 23, 4.8, 43000],
  neonatology: [24, 23, 24, 0, 4.9, 52000],
  dermatology: [0, 0, 86, 14, 4.7, 18000],
  psychiatry: [20, 17, 46, 9, 4.6, 22000],
  ophthalmology: [6, 3, 79, 25, 4.7, 33000],
  ent: [8, 5, 66, 18, 4.6, 19000],
  dentistry: [0, 0, 58, 11, 4.8, 15000],
  radiology: [0, 0, 214, 27, 4.5, 57000],
  "pathology-lab": [0, 0, 388, 8, 4.6, 39000],
  pharmacy: [0, 0, 412, 6, 4.7, 48000],
  physiotherapy: [20, 15, 92, 10, 4.8, 17000],
  nutrition: [0, 0, 38, 7, 4.8, 6000],
};

function deptStatus(beds: number, occupied: number, wait: number): DeptStatus {
  const occ = beds ? occupied / beds : 0;
  if (occ >= 0.95 || wait >= 30) return "full";
  if (occ >= 0.88 || wait >= 22) return "busy";
  return "open";
}

export const departmentStats: DepartmentStat[] = departments.map((d) => {
  const [beds, occupied, patientsToday, waitMin, satisfaction, revenueDay] = deptRaw[d.slug] ?? [0, 0, 20, 15, 4.6, 10000];
  return { slug: d.slug, name: d.name, group: d.group, beds, occupied, patientsToday, waitMin, satisfaction, revenueDay, status: deptStatus(beds, occupied, waitMin) };
});

export const departmentStatsBySlug = Object.fromEntries(departmentStats.map((d) => [d.slug, d])) as Record<string, DepartmentStat>;

export const bedTotals = {
  total: departmentStats.reduce((s, d) => s + d.beds, 0),
  occupied: departmentStats.reduce((s, d) => s + d.occupied, 0),
};
/** Occupancy % yesterday, for the delta on the overview. */
export const bedOccupancyYesterday = 84.2;

/** Occupancy per department group (only groups with beds). */
export const bedsByGroup = departmentGroups
  .map((g) => {
    const list = departmentStats.filter((d) => d.group === g.id);
    const beds = list.reduce((s, d) => s + d.beds, 0);
    const occupied = list.reduce((s, d) => s + d.occupied, 0);
    return { id: g.id, name: g.name, beds, occupied, pct: beds ? Math.round((occupied / beds) * 100) : 0 };
  })
  .filter((g) => g.beds > 0);

/** Department numbers for a date range (visits, wait, satisfaction, revenue). */
export function departmentPerformance(id: RangeId) {
  const r = ranges.find((x) => x.id === id)!;
  return departmentStats.map((d, i) => {
    const f = 0.92 + 0.16 * noise(i, r.days);
    return {
      slug: d.slug,
      name: d.name,
      group: d.group,
      visits: Math.round(d.patientsToday * r.days * f),
      avgWait: Math.max(0, Math.round(d.waitMin * (0.9 + 0.2 * noise(i, r.days + 1)))),
      satisfaction: Math.min(5, Math.round((d.satisfaction + 0.12 * (noise(i, r.days + 2) - 0.5)) * 10) / 10),
      revenue: round(d.revenueDay * r.days * f, 100),
    };
  });
}

/** Patients per day for one department, last 14 days (dialog sparkline). */
export function departmentTrend(slug: string) {
  const d = departmentStatsBySlug[slug];
  const seed = slug.length * 31 + slug.charCodeAt(0);
  return lastDays(14).map((day, i) => ({
    label: fmtDay.format(day.date),
    patients: Math.round((d?.patientsToday ?? 20) * (day.visits / 2650) * (0.9 + 0.2 * noise(seed, i))),
  }));
}

/** Head of department: a doctor from that department, or a made-up lead. */
export const departmentLeads: Record<string, string> = {
  emergency: "Dr. Samuel Achebe",
  icu: "Dr. Ingrid Holm",
  anesthesiology: "Dr. Paolo Ricci",
  pulmonology: "Dr. Hana Sato",
  gastroenterology: "Dr. Leon Fischer",
  nephrology: "Dr. Ruth Mensah",
  endocrinology: "Dr. Clara Jensen",
  neurosurgery: "Dr. Viktor Novak",
  urology: "Dr. Kwame Asante",
  "plastic-surgery": "Dr. Sofia Marin",
  neonatology: "Dr. Elif Demir",
  ophthalmology: "Dr. Noah Feld",
  ent: "Dr. Priyanka Das",
  "pathology-lab": "Dr. Martin Kessler",
  pharmacy: "Dr. Joy Adeyemi, PharmD",
  physiotherapy: "Alex Moreau, PT",
  nutrition: "Lena Ortiz, RD",
};

/* ---------------------------------------------------------------------- ER */

export const erTriage = [
  { level: 1, label: "Resuscitation", count: 1, target: "Immediate" },
  { level: 2, label: "Emergent", count: 4, target: "10 min" },
  { level: 3, label: "Urgent", count: 11, target: "30 min" },
  { level: 4, label: "Less urgent", count: 9, target: "60 min" },
  { level: 5, label: "Non-urgent", count: 3, target: "120 min" },
];

export const erNow = {
  waiting: erTriage.reduce((s, t) => s + t.count, 0),
  inTreatment: 34,
  avgWait: 24,
  avgWaitLastWeek: 27,
  longestWait: 71,
  ambulancesInbound: 3,
  beds: 40,
  bedsOccupied: 37,
};

const hourShape = [0.55, 0.45, 0.4, 0.35, 0.35, 0.4, 0.55, 0.75, 0.95, 1.1, 1.2, 1.25, 1.3, 1.3, 1.25, 1.2, 1.2, 1.3, 1.45, 1.5, 1.4, 1.2, 0.95, 0.7];
export const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Average ER wait (minutes) by weekday (Mon first) and hour, for a range. */
export function erHeatmap(id: RangeId) {
  const r = ranges.find((x) => x.id === id)!;
  return weekdays.map((day, d) => ({
    day,
    hours: hourShape.map((h, hour) => Math.round(20 * h * (d >= 5 ? 1.12 : d === 0 ? 1.08 : 1) * (0.85 + 0.3 * noise(d * 24 + hour, r.days)))),
  }));
}

/* ------------------------------------------------------------ satisfaction */

export function satisfaction(id: RangeId) {
  const r = ranges.find((x) => x.id === id)!;
  const promoters = 68 + Math.round(6 * noise(r.days, 1));
  const detractors = 6 + Math.round(4 * noise(r.days, 2));
  const passives = 100 - promoters - detractors;
  const prevNps = promoters - detractors - 2 - Math.round(4 * noise(r.days, 3));
  const responses = Math.round(r.days * 41 * (0.9 + 0.2 * noise(r.days, 4)));
  const areas = [
    { label: "Doctors", score: 4.8 },
    { label: "Nursing", score: 4.8 },
    { label: "Cleanliness", score: 4.7 },
    { label: "Food", score: 4.2 },
    { label: "Wait times", score: 3.9 },
    { label: "Billing", score: 4.3 },
  ].map((a, i) => ({ ...a, score: Math.round((a.score + 0.2 * (noise(i, r.days + 9) - 0.5)) * 10) / 10 }));
  return { promoters, passives, detractors, nps: promoters - detractors, prevNps, responses, areas };
}

/* ---------------------------------------------------------- marketplace mix */

const categoryShare: Record<MarketplaceCategoryId, number> = {
  pharmacy: 0.24,
  "lab-tests": 0.17,
  "health-packages": 0.15,
  "medical-devices": 0.13,
  consultations: 0.09,
  wellness: 0.07,
  mobility: 0.06,
  "mother-baby": 0.04,
  "personal-care": 0.03,
  "first-aid": 0.02,
};

/** Marketplace revenue per category for a range, largest first. */
export function topCategories(id: RangeId) {
  const r = ranges.find((x) => x.id === id)!;
  const total = rangeTotals(id).current.marketplace;
  return marketplaceCategories
    .map((c, i) => ({ id: c.id, name: c.name, revenue: round(total * categoryShare[c.id] * (0.9 + 0.2 * noise(i, r.days)), 10) }))
    .sort((a, b) => b.revenue - a.revenue);
}

/** Today's marketplace revenue before live orders from the orders store are added. */
export const marketplaceBaseToday = () => dayStats(0).marketplace;

/* ---------------------------------------------------------------- payer mix */

const payerShare: Record<string, number> = {
  northwind: 19,
  brightpath: 15,
  harborline: 13,
  cobalt: 11,
  evergreen: 9,
  orion: 7,
  solace: 5,
  pinecrest: 4,
  atlas: 4,
  cedarstone: 3,
};

/** Share of billed revenue by payer: top 5 insurers, other insurers, self-pay. */
export function payerMix(id: RangeId) {
  const r = ranges.find((x) => x.id === id)!;
  const rows = insurers
    .map((ins, i) => ({ id: ins.id, name: ins.name, share: payerShare[ins.id] + Math.round(2 * (noise(i, r.days) - 0.5)) }))
    .sort((a, b) => b.share - a.share);
  const top = rows.slice(0, 5);
  const other = rows.slice(5).reduce((s, x) => s + x.share, 0);
  const selfPay = 100 - top.reduce((s, x) => s + x.share, 0) - other;
  return [...top, { id: "other", name: "Other insurers", share: other }, { id: "self-pay", name: "Self-pay", share: selfPay }];
}

/* ----------------------------------------------------------------- staffing */

export const staffing = {
  onShiftNow: 412,
  openShifts: [
    { id: "os-1", department: "icu", shift: "Night", role: "ICU nurse", count: 2 },
    { id: "os-2", department: "emergency", shift: "Night", role: "Staff nurse", count: 1 },
    { id: "os-3", department: "pediatrics", shift: "Evening", role: "Pediatric nurse", count: 1 },
    { id: "os-4", department: "radiology", shift: "Night", role: "CT technologist", count: 1 },
    { id: "os-5", department: "general-surgery", shift: "Day", role: "Scrub nurse", count: 2 },
  ],
  onLeave: 23,
};

/* ---------------------------------------------------------------- inventory */

export type SupplyCategory = "PPE" | "IV & infusion" | "Needles & syringes" | "Respiratory" | "Drug stock" | "Linens" | "Surgical" | "Lab";

export const supplyCategories: SupplyCategory[] = ["PPE", "IV & infusion", "Needles & syringes", "Respiratory", "Drug stock", "Linens", "Surgical", "Lab"];

export interface SupplyItem {
  id: string;
  name: string;
  category: SupplyCategory;
  unit: string;
  location: string;
  stock: number;
  reorderLevel: number;
  /** Unit cost in USD. */
  unitCost: number;
  supplier: string;
  /** Days since the last delivery. */
  lastRestockDays: number;
}

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export function stockStatus(stock: number, reorderLevel: number): StockStatus {
  if (stock <= 0) return "out-of-stock";
  if (stock <= reorderLevel) return "low-stock";
  return "in-stock";
}

const S = {
  medline: "Brightfield Medical Supply",
  north: "Northgate Surgical",
  pharma: "Lumen Pharma Wholesale",
  oxy: "ClearAir Gases",
  linen: "Riverside Linen Services",
  lab: "Vector Lab Systems",
};

export const supplies: SupplyItem[] = [
  { id: "sup-gloves-m", name: "Nitrile exam gloves, size M", category: "PPE", unit: "box of 100", location: "Central store, A1", stock: 840, reorderLevel: 300, unitCost: 8.5, supplier: S.medline, lastRestockDays: 6 },
  { id: "sup-gloves-l", name: "Nitrile exam gloves, size L", category: "PPE", unit: "box of 100", location: "Central store, A1", stock: 210, reorderLevel: 250, unitCost: 8.5, supplier: S.medline, lastRestockDays: 19 },
  { id: "sup-masks", name: "Surgical face masks, type IIR", category: "PPE", unit: "box of 50", location: "Central store, A2", stock: 1260, reorderLevel: 400, unitCost: 6.2, supplier: S.medline, lastRestockDays: 4 },
  { id: "sup-n95", name: "FFP2 respirator masks", category: "PPE", unit: "box of 20", location: "Central store, A2", stock: 96, reorderLevel: 120, unitCost: 24, supplier: S.medline, lastRestockDays: 27 },
  { id: "sup-gowns", name: "Isolation gowns, level 2", category: "PPE", unit: "pack of 10", location: "Central store, A3", stock: 380, reorderLevel: 150, unitCost: 14, supplier: S.north, lastRestockDays: 11 },
  { id: "sup-iv-sets", name: "IV administration sets", category: "IV & infusion", unit: "each", location: "Central store, B1", stock: 1450, reorderLevel: 600, unitCost: 3.4, supplier: S.north, lastRestockDays: 8 },
  { id: "sup-cannula-20", name: "IV cannula 20G", category: "IV & infusion", unit: "box of 50", location: "Central store, B1", stock: 64, reorderLevel: 80, unitCost: 32, supplier: S.north, lastRestockDays: 22 },
  { id: "sup-saline", name: "Saline 0.9%, 1 L bags", category: "IV & infusion", unit: "bag", location: "Pharmacy store, P2", stock: 2200, reorderLevel: 900, unitCost: 1.9, supplier: S.pharma, lastRestockDays: 3 },
  { id: "sup-pump-sets", name: "Infusion pump cassettes", category: "IV & infusion", unit: "each", location: "Central store, B2", stock: 0, reorderLevel: 120, unitCost: 11.5, supplier: S.north, lastRestockDays: 34 },
  { id: "sup-syringe-5", name: "Syringes 5 ml, luer lock", category: "Needles & syringes", unit: "box of 100", location: "Central store, C1", stock: 520, reorderLevel: 200, unitCost: 9.8, supplier: S.medline, lastRestockDays: 9 },
  { id: "sup-syringe-10", name: "Syringes 10 ml, luer lock", category: "Needles & syringes", unit: "box of 100", location: "Central store, C1", stock: 310, reorderLevel: 200, unitCost: 11.2, supplier: S.medline, lastRestockDays: 14 },
  { id: "sup-needles", name: "Safety needles 21G", category: "Needles & syringes", unit: "box of 100", location: "Central store, C2", stock: 140, reorderLevel: 180, unitCost: 13.5, supplier: S.medline, lastRestockDays: 21 },
  { id: "sup-sharps", name: "Sharps containers, 5 L", category: "Needles & syringes", unit: "each", location: "Central store, C3", stock: 260, reorderLevel: 100, unitCost: 4.6, supplier: S.north, lastRestockDays: 12 },
  { id: "sup-o2-cyl", name: "Oxygen cylinders, size E", category: "Respiratory", unit: "cylinder", location: "Gas store, G1", stock: 38, reorderLevel: 40, unitCost: 52, supplier: S.oxy, lastRestockDays: 5 },
  { id: "sup-o2-masks", name: "Non-rebreather oxygen masks", category: "Respiratory", unit: "each", location: "Central store, D1", stock: 450, reorderLevel: 150, unitCost: 2.8, supplier: S.medline, lastRestockDays: 10 },
  { id: "sup-nasal", name: "Nasal cannula, adult", category: "Respiratory", unit: "each", location: "Central store, D1", stock: 620, reorderLevel: 200, unitCost: 1.4, supplier: S.medline, lastRestockDays: 10 },
  { id: "sup-vent-circuits", name: "Ventilator circuits, adult", category: "Respiratory", unit: "each", location: "ICU store, L3", stock: 42, reorderLevel: 30, unitCost: 38, supplier: S.north, lastRestockDays: 16 },
  { id: "sup-paracetamol", name: "Paracetamol IV 1 g", category: "Drug stock", unit: "vial", location: "Pharmacy store, P1", stock: 960, reorderLevel: 400, unitCost: 2.1, supplier: S.pharma, lastRestockDays: 7 },
  { id: "sup-ceftriaxone", name: "Ceftriaxone 1 g", category: "Drug stock", unit: "vial", location: "Pharmacy store, P1", stock: 180, reorderLevel: 250, unitCost: 3.9, supplier: S.pharma, lastRestockDays: 18 },
  { id: "sup-heparin", name: "Heparin 5,000 IU", category: "Drug stock", unit: "ampoule", location: "Pharmacy store, P1", stock: 640, reorderLevel: 300, unitCost: 4.4, supplier: S.pharma, lastRestockDays: 9 },
  { id: "sup-insulin", name: "Insulin, rapid-acting pens", category: "Drug stock", unit: "pen", location: "Pharmacy fridge, F1", stock: 75, reorderLevel: 90, unitCost: 18, supplier: S.pharma, lastRestockDays: 24 },
  { id: "sup-adrenaline", name: "Adrenaline 1 mg/ml", category: "Drug stock", unit: "ampoule", location: "Pharmacy store, P3", stock: 310, reorderLevel: 120, unitCost: 2.7, supplier: S.pharma, lastRestockDays: 13 },
  { id: "sup-morphine", name: "Morphine 10 mg (controlled)", category: "Drug stock", unit: "ampoule", location: "Controlled drugs safe, P4", stock: 0, reorderLevel: 60, unitCost: 3.2, supplier: S.pharma, lastRestockDays: 31 },
  { id: "sup-sheets", name: "Bed sheets, single", category: "Linens", unit: "each", location: "Linen room, Basement", stock: 3400, reorderLevel: 1200, unitCost: 6, supplier: S.linen, lastRestockDays: 2 },
  { id: "sup-gowns-patient", name: "Patient gowns", category: "Linens", unit: "each", location: "Linen room, Basement", stock: 1180, reorderLevel: 1000, unitCost: 7.5, supplier: S.linen, lastRestockDays: 2 },
  { id: "sup-towels", name: "Bath towels", category: "Linens", unit: "each", location: "Linen room, Basement", stock: 900, reorderLevel: 1000, unitCost: 4.2, supplier: S.linen, lastRestockDays: 15 },
  { id: "sup-drapes", name: "Sterile surgical drapes", category: "Surgical", unit: "pack", location: "Theatre store, OR1", stock: 340, reorderLevel: 150, unitCost: 21, supplier: S.north, lastRestockDays: 8 },
  { id: "sup-sutures", name: "Absorbable sutures 3-0", category: "Surgical", unit: "box of 12", location: "Theatre store, OR1", stock: 88, reorderLevel: 60, unitCost: 46, supplier: S.north, lastRestockDays: 12 },
  { id: "sup-gauze", name: "Sterile gauze swabs", category: "Surgical", unit: "pack of 100", location: "Central store, E1", stock: 720, reorderLevel: 250, unitCost: 5.5, supplier: S.medline, lastRestockDays: 6 },
  { id: "sup-blood-tubes", name: "Blood collection tubes, EDTA", category: "Lab", unit: "rack of 100", location: "Lab store, G2", stock: 150, reorderLevel: 80, unitCost: 17, supplier: S.lab, lastRestockDays: 10 },
  { id: "sup-reagent", name: "Chemistry analyzer reagent kit", category: "Lab", unit: "kit", location: "Lab store, G2", stock: 12, reorderLevel: 15, unitCost: 310, supplier: S.lab, lastRestockDays: 20 },
  { id: "sup-swabs", name: "Viral transport swabs", category: "Lab", unit: "box of 50", location: "Lab store, G3", stock: 230, reorderLevel: 100, unitCost: 28, supplier: S.lab, lastRestockDays: 9 },
];

export const supplyLocations = Array.from(new Set(supplies.map((s) => s.location.split(",")[0])));
