/**
 * Made-up health records for the demo patient (Maya Robinson): lab results with
 * history, imaging and documents, vaccinations and home blood pressure readings.
 * Dates are relative to today so the demo never looks old.
 */

import { daysFromNow } from "@/lib/dates";

export type ResultFlag = "normal" | "high" | "low";

export interface LabResult {
  id: string;
  name: string;
  panel: string;
  value: number;
  unit: string;
  /** Normal range as shown to the patient. */
  range: string;
  low?: number;
  high?: number;
  flag: ResultFlag;
  date: string;
  orderedBy: string;
  /** Older values, oldest first, for the small trend chart. */
  history: { date: string; value: number }[];
  note?: string;
}

const hist = (values: number[], gapDays: number, lastDaysAgo: number) =>
  values.map((value, i) => ({ date: daysFromNow(-(lastDaysAgo + (values.length - 1 - i) * gapDays), "08:10"), value }));

export const labResults: LabResult[] = [
  {
    id: "ldl",
    name: "LDL cholesterol",
    panel: "Heart Health Screen",
    value: 142,
    unit: "mg/dL",
    range: "Below 130",
    high: 130,
    flag: "high",
    date: daysFromNow(-20, "08:10"),
    orderedBy: "Dr. Layla Haddad",
    history: hist([158, 151, 147, 142], 90, 20),
    note: "Slightly high but going down. Dr. Haddad started a low dose statin.",
  },
  {
    id: "total-chol",
    name: "Total cholesterol",
    panel: "Heart Health Screen",
    value: 212,
    unit: "mg/dL",
    range: "Below 200",
    high: 200,
    flag: "high",
    date: daysFromNow(-20, "08:10"),
    orderedBy: "Dr. Layla Haddad",
    history: hist([231, 224, 218, 212], 90, 20),
  },
  {
    id: "hdl",
    name: "HDL cholesterol",
    panel: "Heart Health Screen",
    value: 58,
    unit: "mg/dL",
    range: "Above 40",
    low: 40,
    flag: "normal",
    date: daysFromNow(-20, "08:10"),
    orderedBy: "Dr. Layla Haddad",
    history: hist([52, 54, 55, 58], 90, 20),
  },
  {
    id: "triglycerides",
    name: "Triglycerides",
    panel: "Heart Health Screen",
    value: 118,
    unit: "mg/dL",
    range: "Below 150",
    high: 150,
    flag: "normal",
    date: daysFromNow(-20, "08:10"),
    orderedBy: "Dr. Layla Haddad",
    history: hist([142, 131, 125, 118], 90, 20),
  },
  {
    id: "hba1c",
    name: "HbA1c",
    panel: "Diabetes check",
    value: 5.3,
    unit: "%",
    range: "4.0 – 5.6",
    low: 4,
    high: 5.6,
    flag: "normal",
    date: daysFromNow(-20, "08:10"),
    orderedBy: "Dr. Thomas Weber",
    history: hist([5.5, 5.4, 5.4, 5.3], 120, 20),
  },
  {
    id: "creatinine",
    name: "Creatinine",
    panel: "Kidney function",
    value: 0.8,
    unit: "mg/dL",
    range: "0.6 – 1.1",
    low: 0.6,
    high: 1.1,
    flag: "normal",
    date: daysFromNow(-20, "08:10"),
    orderedBy: "Dr. Layla Haddad",
    history: hist([0.8, 0.9, 0.8, 0.8], 90, 20),
  },
  {
    id: "potassium",
    name: "Potassium",
    panel: "Kidney function",
    value: 4.1,
    unit: "mmol/L",
    range: "3.5 – 5.1",
    low: 3.5,
    high: 5.1,
    flag: "normal",
    date: daysFromNow(-20, "08:10"),
    orderedBy: "Dr. Layla Haddad",
    history: hist([4.3, 4.0, 4.2, 4.1], 90, 20),
  },
  {
    id: "hemoglobin",
    name: "Hemoglobin",
    panel: "Complete Blood Count",
    value: 13.2,
    unit: "g/dL",
    range: "12.0 – 15.5",
    low: 12,
    high: 15.5,
    flag: "normal",
    date: daysFromNow(-62, "09:00"),
    orderedBy: "Dr. Thomas Weber",
    history: hist([12.8, 13.0, 13.4, 13.2], 120, 62),
  },
  {
    id: "tsh",
    name: "TSH (thyroid)",
    panel: "Thyroid Panel",
    value: 2.1,
    unit: "mIU/L",
    range: "0.4 – 4.0",
    low: 0.4,
    high: 4,
    flag: "normal",
    date: daysFromNow(-62, "09:00"),
    orderedBy: "Dr. Thomas Weber",
    history: hist([2.4, 2.2, 1.9, 2.1], 180, 62),
  },
  {
    id: "vitamin-d",
    name: "Vitamin D",
    panel: "Vitamin check",
    value: 24,
    unit: "ng/mL",
    range: "30 – 100",
    low: 30,
    high: 100,
    flag: "low",
    date: daysFromNow(-62, "09:00"),
    orderedBy: "Dr. Thomas Weber",
    history: hist([19, 21, 22, 24], 120, 62),
    note: "A bit low. Daily vitamin D3 and 15 minutes of sun are advised.",
  },
];

export interface RecordDocument {
  id: string;
  title: string;
  kind: "Imaging" | "Report" | "Letter" | "Discharge";
  date: string;
  author: string;
  size: string;
}

export const documents: RecordDocument[] = [
  { id: "doc-1", title: "Echocardiogram report", kind: "Imaging", date: daysFromNow(-19, "11:00"), author: "Heart Center imaging", size: "1.2 MB" },
  { id: "doc-2", title: "Resting ECG (12-lead)", kind: "Imaging", date: daysFromNow(-30, "09:45"), author: "Dr. Layla Haddad", size: "640 KB" },
  { id: "doc-3", title: "Chest X-ray, front view", kind: "Imaging", date: daysFromNow(-62, "14:30"), author: "Radiology", size: "3.8 MB" },
  { id: "doc-4", title: "Heart Health Screen full report", kind: "Report", date: daysFromNow(-20, "16:00"), author: "Hospital lab", size: "420 KB" },
  { id: "doc-5", title: "Referral letter to cardiology", kind: "Letter", date: daysFromNow(-62, "15:10"), author: "Dr. Thomas Weber", size: "96 KB" },
  { id: "doc-6", title: "Dental treatment summary", kind: "Report", date: daysFromNow(-45, "12:00"), author: "Dr. Omar Khalil", size: "210 KB" },
];

export interface Vaccination {
  id: string;
  name: string;
  date: string;
  dose: string;
  givenAt: string;
  /** Next dose or booster, if any. */
  due?: string;
}

export const vaccinations: Vaccination[] = [
  { id: "vac-1", name: "Flu (seasonal)", date: daysFromNow(-35), dose: "Yearly", givenAt: "Hospital pharmacy", due: daysFromNow(330) },
  { id: "vac-2", name: "COVID-19 booster", date: daysFromNow(-160), dose: "Booster", givenAt: "Hospital pharmacy", due: daysFromNow(205) },
  { id: "vac-3", name: "Tetanus, diphtheria, pertussis (Tdap)", date: daysFromNow(-1460), dose: "Booster", givenAt: "Lakeview clinic", due: daysFromNow(2190) },
  { id: "vac-4", name: "Hepatitis B", date: daysFromNow(-4200), dose: "3 of 3", givenAt: "Lakeview clinic" },
  { id: "vac-5", name: "HPV", date: daysFromNow(-6300), dose: "2 of 2", givenAt: "School program" },
];

export const conditions = [
  { name: "High blood pressure (hypertension)", since: "Diagnosed 1 month ago", status: "Active, improving" },
  { name: "Raised LDL cholesterol", since: "Found 3 weeks ago", status: "Active, on treatment" },
  { name: "Low vitamin D", since: "Found 2 months ago", status: "Active, on supplement" },
];

/** Home blood pressure readings for the last 14 days (synced from the cuff). */
export const homeBloodPressure = [
  [138, 88], [136, 87], [139, 89], [135, 86], [134, 86], [133, 85], [135, 85],
  [131, 84], [132, 84], [130, 83], [129, 83], [131, 82], [128, 82], [127, 81],
].map(([systolic, diastolic], i) => {
  const d = new Date(daysFromNow(i - 13));
  return { day: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), systolic, diastolic };
});
