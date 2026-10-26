/**
 * Clinical demo data for the doctor and nurse dashboards: extra patients on
 * Cardiac ward 4B and in clinic, problems, medicines, lab results, vitals
 * history, schedule templates, SBAR handovers and shift tasks.
 * Everything here is made up. Times are built when called, relative to now.
 */

import { admittedPatients, patients, patientsById, patientsOfDoctor, type Patient } from "./patients";

export const DOCTOR_ID = "layla-haddad";
export const NURSE_ID = "sam-okafor";
export const HOME_WARD = "Cardiac ward 4B";

export const ROUND_TIMES = ["06:00", "10:00", "14:00", "18:00", "22:00"] as const;
export type RoundTime = (typeof ROUND_TIMES)[number];

/* ------------------------------------------------------------------ */
/* Extra patients (ward 4B occupants and clinic outpatients)           */
/* ------------------------------------------------------------------ */

const extra = (p: Omit<Patient, "department" | "phone"> & { phone?: string; department?: string }): Patient => ({
  department: "cardiology",
  phone: `+1 (555) 015-${p.mrn.slice(-4)}`,
  ...p,
});

export const extraPatients: Patient[] = [
  extra({ id: "walter-brooks", name: "Walter Brooks", age: 76, sex: "M", mrn: "AUR-184402", doctorId: DOCTOR_ID, status: "observation", ward: HOME_WARD, bed: "01", admittedAt: "Yesterday", condition: "Atrial fibrillation, fast rate", allergies: [], insurerId: "brightpath", bloodType: "O+", vitals: { hr: 112, bp: "128/80", spo2: 95, temp: 36.8, rr: 18 }, news: 3 }),
  extra({ id: "ines-moreau", name: "Ines Moreau", age: 69, sex: "F", mrn: "AUR-190917", doctorId: DOCTOR_ID, status: "stable", ward: HOME_WARD, bed: "02", admittedAt: "2 days ago", condition: "NSTEMI, day 2", allergies: ["Morphine"], insurerId: "harborline", bloodType: "A-", vitals: { hr: 82, bp: "132/78", spo2: 95, temp: 36.0, rr: 17 }, news: 2 }),
  extra({ id: "daniel-kim", name: "Daniel Kim", age: 54, sex: "M", mrn: "AUR-206645", doctorId: "thomas-weber", department: "internal-medicine", status: "stable", ward: HOME_WARD, bed: "05", admittedAt: "3 days ago", condition: "Pericarditis, improving", allergies: [], insurerId: "atlas", bloodType: "B+", vitals: { hr: 88, bp: "124/74", spo2: 98, temp: 37.4, rr: 16 }, news: 0 }),
  extra({ id: "margaret-shaw", name: "Margaret Shaw", age: 84, sex: "F", mrn: "AUR-170233", doctorId: DOCTOR_ID, status: "observation", ward: HOME_WARD, bed: "08", admittedAt: "5 days ago", condition: "Heart failure, worsening breath", allergies: ["Latex"], insurerId: "brightpath", bloodType: "A+", vitals: { hr: 98, bp: "104/62", spo2: 94, temp: 37.0, rr: 21 }, news: 5 }),
  extra({ id: "kofi-mensah", name: "Kofi Mensah", age: 61, sex: "M", mrn: "AUR-195580", doctorId: DOCTOR_ID, status: "stable", ward: HOME_WARD, bed: "10", admittedAt: "6 days ago", condition: "Bypass surgery (CABG), day 5", allergies: [], insurerId: "harborline", bloodType: "O-", vitals: { hr: 84, bp: "118/72", spo2: 95, temp: 37.3, rr: 17 }, news: 1 }),
  extra({ id: "elena-petrova", name: "Elena Petrova", age: 47, sex: "F", mrn: "AUR-209134", doctorId: "thomas-weber", department: "internal-medicine", status: "observation", ward: HOME_WARD, bed: "14", admittedAt: "4 days ago", condition: "Endocarditis, IV antibiotics", allergies: ["Penicillin"], insurerId: "evergreen", bloodType: "B-", vitals: { hr: 96, bp: "116/70", spo2: 95, temp: 38.4, rr: 18 }, news: 3 }),
  extra({ id: "robert-lang", name: "Robert Lang", age: 73, sex: "M", mrn: "AUR-181276", doctorId: DOCTOR_ID, status: "stable", ward: HOME_WARD, bed: "15", admittedAt: "Yesterday", condition: "Fainting, pacemaker planned", allergies: [], insurerId: "cobalt", bloodType: "AB+", vitals: { hr: 48, bp: "108/66", spo2: 97, temp: 36.6, rr: 15 }, news: 2 }),
  extra({ id: "sofia-almeida", name: "Sofia Almeida", age: 42, sex: "F", mrn: "AUR-213310", doctorId: DOCTOR_ID, status: "outpatient", condition: "Chest tightness on exercise", allergies: [], insurerId: "evergreen", bloodType: "O+", vitals: { hr: 76, bp: "122/78", spo2: 99, temp: 36.6, rr: 14 }, news: 0 }),
  extra({ id: "hugo-lambert", name: "Hugo Lambert", age: 66, sex: "M", mrn: "AUR-188954", doctorId: DOCTOR_ID, status: "outpatient", condition: "Atrial fibrillation, warfarin review", allergies: ["Codeine"], insurerId: "northwind", bloodType: "A+", vitals: { hr: 78, bp: "136/84", spo2: 97, temp: 36.7, rr: 15 }, news: 0 }),
  extra({ id: "nadia-farouk", name: "Nadia Farouk", age: 38, sex: "F", mrn: "AUR-212208", doctorId: DOCTOR_ID, status: "outpatient", condition: "Heart muscle weakness after pregnancy", allergies: [], insurerId: "orion", bloodType: "B+", vitals: { hr: 80, bp: "110/70", spo2: 98, temp: 36.8, rr: 15 }, news: 0 }),
  extra({ id: "tariq-hassan", name: "Tariq Hassan", age: 58, sex: "M", mrn: "AUR-197741", doctorId: DOCTOR_ID, status: "outpatient", condition: "Stable angina, medicine review", allergies: [], insurerId: "solace", bloodType: "O+", vitals: { hr: 68, bp: "138/86", spo2: 98, temp: 36.5, rr: 14 }, news: 0 }),
  extra({ id: "beatrice-owusu", name: "Beatrice Owusu", age: 71, sex: "F", mrn: "AUR-179062", doctorId: DOCTOR_ID, status: "outpatient", condition: "Aortic valve narrowing, yearly review", allergies: ["Sulfa drugs"], insurerId: "brightpath", bloodType: "A-", vitals: { hr: 72, bp: "142/80", spo2: 97, temp: 36.6, rr: 16 }, news: 0 }),
  extra({ id: "liam-oconnell", name: "Liam O'Connell", age: 45, sex: "M", mrn: "AUR-210482", doctorId: DOCTOR_ID, status: "outpatient", condition: "High blood pressure", allergies: [], insurerId: "pinecrest", bloodType: "B+", vitals: { hr: 74, bp: "148/94", spo2: 99, temp: 36.7, rr: 14 }, news: 0 }),
  extra({ id: "ruth-adeyemi", name: "Ruth Adeyemi", age: 50, sex: "F", mrn: "AUR-205967", doctorId: DOCTOR_ID, status: "outpatient", condition: "Short of breath on stairs", allergies: [], insurerId: "cedarstone", bloodType: "O+", vitals: { hr: 82, bp: "130/82", spo2: 97, temp: 36.6, rr: 16 }, news: 0 }),
];

/** Every patient the clinical screens know about. */
export const clinicalPatients: Patient[] = [...patients, ...extraPatients];
export const clinicalPatientsById = { ...patientsById, ...Object.fromEntries(extraPatients.map((p) => [p.id, p])) } as Record<string, Patient>;

export function getClinicalPatient(id: string): Patient | undefined {
  return clinicalPatientsById[id];
}

/** Dr. Haddad's patients: her own list plus the extra demo patients she looks after. */
export const doctorPatients: Patient[] = [...patientsOfDoctor(DOCTOR_ID), ...extraPatients.filter((p) => p.doctorId === DOCTOR_ID)];

export const allAdmitted: Patient[] = [...admittedPatients, ...extraPatients.filter((p) => p.ward)];

export const wards: string[] = [HOME_WARD, ...Array.from(new Set(admittedPatients.map((p) => p.ward!))).filter((w) => w !== HOME_WARD).sort()];

export function wardPatients(ward: string) {
  return allAdmitted.filter((p) => p.ward === ward).sort((a, b) => Number(a.bed) - Number(b.bed));
}

/** Number of beds drawn on the ward board. */
export function wardBedCount(ward: string) {
  const max = Math.max(0, ...wardPatients(ward).map((p) => Number(p.bed)));
  return Math.max(16, Math.ceil(max / 4) * 4);
}

/* ------------------------------------------------------------------ */
/* NEWS2 early warning score                                           */
/* ------------------------------------------------------------------ */

export type Avpu = "A" | "C" | "V" | "P" | "U";
export const avpuLabels: Record<Avpu, string> = {
  A: "Alert",
  C: "New confusion",
  V: "Responds to voice",
  P: "Responds to pain",
  U: "Unresponsive",
};

export type NewsBand = "low" | "low-medium" | "medium" | "high";

export interface VitalsInput {
  hr: number;
  sys: number;
  spo2: number;
  temp: number;
  rr: number;
  avpu?: Avpu;
  onOxygen?: boolean;
}

/** Simplified NEWS2 (SpO2 scale 1). Returns the total, each part and the risk band. */
export function newsScore(v: VitalsInput) {
  const rr = v.rr <= 8 ? 3 : v.rr <= 11 ? 1 : v.rr <= 20 ? 0 : v.rr <= 24 ? 2 : 3;
  const spo2 = v.spo2 <= 91 ? 3 : v.spo2 <= 93 ? 2 : v.spo2 <= 95 ? 1 : 0;
  const o2 = v.onOxygen ? 2 : 0;
  const sys = v.sys <= 90 ? 3 : v.sys <= 100 ? 2 : v.sys <= 110 ? 1 : v.sys <= 219 ? 0 : 3;
  const hr = v.hr <= 40 ? 3 : v.hr <= 50 ? 1 : v.hr <= 90 ? 0 : v.hr <= 110 ? 1 : v.hr <= 130 ? 2 : 3;
  const avpu = !v.avpu || v.avpu === "A" ? 0 : 3;
  const temp = v.temp <= 35 ? 3 : v.temp <= 36 ? 1 : v.temp <= 38 ? 0 : v.temp <= 39 ? 1 : 2;
  const parts = { rr, spo2, o2, sys, hr, avpu, temp };
  const score = rr + spo2 + o2 + sys + hr + avpu + temp;
  const anyThree = Object.values(parts).some((n) => n === 3);
  return { score, parts, band: newsBand(score, anyThree) };
}

export function newsBand(score: number, anyThree = false): NewsBand {
  if (score >= 7) return "high";
  if (score >= 5) return "medium";
  if (anyThree) return "low-medium";
  return "low";
}

export const newsBandLabels: Record<NewsBand, string> = {
  high: "High risk",
  medium: "Medium risk",
  "low-medium": "Watch closely",
  low: "Low risk",
};

export function parseBp(bp: string) {
  const [sys, dia] = bp.split("/").map(Number);
  return { sys, dia };
}

/* ------------------------------------------------------------------ */
/* Vitals history (48 h, every 4 h)                                    */
/* ------------------------------------------------------------------ */

export interface VitalsPoint {
  at: string;
  hr: number;
  sys: number;
  dia: number;
  spo2: number;
  temp: number;
  rr: number;
  news: number;
}

function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const NORMAL = { hr: 74, sys: 122, dia: 76, spo2: 98, temp: 36.7, rr: 15 };

/** 13 readings over the last 48 hours ending with the patient's latest vitals. */
export function vitalsHistory(p: Patient): VitalsPoint[] {
  const rand = seeded(p.id);
  const now = parseBp(p.vitals.bp);
  const current = { hr: p.vitals.hr, sys: now.sys, dia: now.dia, spo2: p.vitals.spo2, temp: p.vitals.temp, rr: p.vitals.rr };
  const worsening = p.status === "critical" || p.status === "observation";
  const start = worsening
    ? NORMAL
    : { hr: current.hr + 12, sys: current.sys + 10, dia: current.dia + 6, spo2: current.spo2 - 2, temp: current.temp + 0.6, rr: current.rr + 3 };
  const anchor = new Date();
  anchor.setMinutes(0, 0, 0);
  const points: VitalsPoint[] = [];
  for (let i = 0; i <= 12; i++) {
    const f = worsening ? Math.pow(i / 12, 1.6) : i / 12;
    const last = i === 12;
    const noise = (n: number) => (last ? 0 : (rand() - 0.5) * 2 * n);
    const mix = (k: keyof typeof current) => start[k] + (current[k] - start[k]) * f;
    const point = {
      hr: Math.round(mix("hr") + noise(4)),
      sys: Math.round(mix("sys") + noise(5)),
      dia: Math.round(mix("dia") + noise(3)),
      spo2: Math.min(100, Math.round(mix("spo2") + noise(0.8))),
      temp: Math.round((mix("temp") + noise(0.15)) * 10) / 10,
      rr: Math.round(mix("rr") + noise(1.2)),
    };
    const at = new Date(anchor.getTime() - (12 - i) * 4 * 3_600_000).toISOString();
    points.push({ at, ...point, news: last ? p.news : newsScore(point).score });
  }
  return points;
}

/* ------------------------------------------------------------------ */
/* Problems, medicines, flags, timeline, SBAR                          */
/* ------------------------------------------------------------------ */

export interface Med {
  name: string;
  dose: string;
  route: "PO" | "IV" | "SC" | "Inh";
  times: RoundTime[];
}

export interface Sbar {
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
}

export interface TimelineEvent {
  /** Days from today (negative = past) and a time of day. */
  days: number;
  time: string;
  title: string;
  detail: string;
  kind: "admission" | "test" | "procedure" | "medication" | "visit" | "note";
}

export interface ClinicalDetail {
  problems: string[];
  meds: Med[];
  flags: { fallRisk?: boolean; isolation?: string; dnr?: boolean };
  dischargeToday?: boolean;
  avpu: Avpu;
  pain: number;
  sbar?: Sbar;
  timeline: TimelineEvent[];
}

const m = (name: string, dose: string, route: Med["route"], ...times: RoundTime[]): Med => ({ name, dose, route, times });
const ev = (days: number, time: string, kind: TimelineEvent["kind"], title: string, detail: string): TimelineEvent => ({ days, time, kind, title, detail });

const details: Record<string, Partial<ClinicalDetail>> = {
  "maya-robinson": {
    problems: ["High blood pressure (stage 1)", "Raised LDL cholesterol", "Family history of heart disease"],
    meds: [m("Amlodipine", "5 mg", "PO", "10:00")],
    timeline: [
      ev(-62, "14:00", "visit", "Annual check (video)", "Dr. Weber ordered a heart health screen."),
      ev(-30, "09:30", "visit", "New patient visit", "BP 138/88. Lifestyle plan and home BP checks."),
      ev(-20, "08:10", "test", "Heart health screen", "All markers in range except LDL (slightly high)."),
      ev(2, "10:30", "visit", "Follow-up booked", "Blood pressure review with Dr. Haddad."),
    ],
  },
  "james-whitaker": {
    problems: ["Heart failure with low ejection fraction (EF 30%)", "Fluid overload", "Chronic kidney disease, stage 3", "Type 2 diabetes"],
    meds: [m("Furosemide", "40 mg", "IV", "06:00", "14:00"), m("Bisoprolol", "2.5 mg", "PO", "10:00"), m("Ramipril", "2.5 mg", "PO", "10:00"), m("Spironolactone", "25 mg", "PO", "10:00"), m("Enoxaparin", "40 mg", "SC", "18:00")],
    flags: { fallRisk: true },
    sbar: {
      situation: "Heart failure with fluid overload, day 2. Breathing a little easier but still on 2 L oxygen at night.",
      background: "Known heart failure (EF 30%), kidney disease stage 3 and diabetes. On IV furosemide twice a day.",
      assessment: "NEWS 4. Weight down 1.2 kg since admission. Urine output good. Ankles still swollen. Creatinine slightly up.",
      recommendation: "Daily weight before breakfast. Strict fluid balance, 1.5 L limit. Repeat kidney bloods in the morning. Call doctor if SpO2 under 92%.",
    },
    timeline: [
      ev(-2, "16:40", "admission", "Admitted from emergency", "Short of breath, legs swollen, weight up 4 kg in a week."),
      ev(-2, "17:30", "test", "Chest X-ray", "Fluid at both lung bases, large heart shadow."),
      ev(-2, "18:00", "medication", "IV furosemide started", "40 mg twice a day."),
      ev(-1, "09:00", "test", "Echo", "Ejection fraction 30%, no new valve problem."),
      ev(0, "07:00", "test", "Morning bloods", "BNP 1,240, creatinine 1.6, sodium 132."),
    ],
  },
  "rosa-delgado": {
    problems: ["Coronary artery disease", "Stent to right coronary artery (day 3)", "High blood pressure"],
    meds: [m("Aspirin", "75 mg", "PO", "10:00"), m("Ticagrelor", "90 mg", "PO", "10:00", "22:00"), m("Atorvastatin", "80 mg", "PO", "22:00"), m("Bisoprolol", "2.5 mg", "PO", "10:00")],
    sbar: {
      situation: "Day 3 after a stent to the right coronary artery. Comfortable, walking on the ward.",
      background: "Came in with chest pain 4 days ago. Allergic to iodine contrast (given pre-medication for the procedure).",
      assessment: "NEWS 1. Wrist puncture site clean and dry. No chest pain. Hemoglobin slightly low (11.8).",
      recommendation: "Cardiac rehab nurse to see her today. Likely home tomorrow if bloods are stable. Teach-back on dual antiplatelet medicines.",
    },
    timeline: [
      ev(-4, "11:20", "admission", "Admitted with chest pain", "ECG changes in the inferior leads."),
      ev(-3, "10:00", "procedure", "Coronary angiogram and stent", "One stent to the right coronary artery, good result."),
      ev(-2, "08:00", "note", "Ward round", "Doing well, mobilising."),
      ev(0, "07:00", "test", "Morning bloods", "Hemoglobin 11.8, kidneys normal."),
    ],
  },
  "ahmed-saleh": {
    problems: ["Chest pain, possible heart attack (NSTEMI)", "Type 2 diabetes", "Ex-smoker (40 pack-years)", "Aspirin allergy (rash and wheeze)"],
    meds: [m("Clopidogrel", "75 mg", "PO", "10:00"), m("Fondaparinux", "2.5 mg", "SC", "18:00"), m("Atorvastatin", "80 mg", "PO", "22:00"), m("Pantoprazole", "40 mg", "PO", "06:00"), m("Paracetamol", "1 g", "PO", "06:00", "14:00", "22:00")],
    flags: { fallRisk: true },
    pain: 4,
    sbar: {
      situation: "Admitted this morning with chest pain. Troponin raised, treated as a possible heart attack. NEWS 7.",
      background: "72 years old, diabetes, ex-smoker. Allergic to aspirin, so on clopidogrel only.",
      assessment: "Heart rate 118, BP 96/60, SpO2 91% on air, mild fever. Pain 4/10. Looks pale and sweaty.",
      recommendation: "Hourly obs. Keep nil by mouth for angiogram at 13:00. Repeat troponin and ECG at 12:40. Escalate at once if pain rises or BP under 90.",
    },
    timeline: [
      ev(0, "05:10", "admission", "Arrived by ambulance", "Central chest pain since 05:00, sweaty, short of breath."),
      ev(0, "05:20", "test", "ECG", "ST depression in V4–V6."),
      ev(0, "06:40", "admission", "Moved to Cardiac ward 4B", "Bed 03, close to the nurses' station."),
      ev(0, "07:00", "test", "Troponin I", "0.42 ng/mL, well above range."),
      ev(0, "07:50", "note", "Ward round", "Plan angiogram today."),
    ],
  },
  "chloe-martin": {
    problems: ["Palpitations", "Mild anxiety"],
    meds: [],
    timeline: [
      ev(-14, "15:00", "visit", "New patient visit", "Palpitations at night for 3 months. Holter monitor fitted."),
      ev(-7, "09:00", "test", "Holter report", "Sinus rhythm, rare extra beats, no pauses."),
      ev(-1, "16:00", "visit", "Video visit", "Results explained. Draft note to sign."),
    ],
  },
  "george-okoro": {
    problems: ["High cholesterol", "Overweight (BMI 31)", "Pre-diabetes"],
    meds: [m("Atorvastatin", "20 mg", "PO", "22:00")],
    timeline: [
      ev(-40, "10:00", "visit", "Clinic visit", "Started atorvastatin 20 mg."),
      ev(-1, "08:00", "test", "Lipid profile", "Total cholesterol 248, triglycerides 210."),
    ],
  },
  "walter-brooks": {
    problems: ["Atrial fibrillation with fast rate", "High blood pressure", "Mild memory problems"],
    meds: [m("Metoprolol", "25 mg", "PO", "06:00", "18:00"), m("Apixaban", "5 mg", "PO", "10:00", "22:00"), m("Digoxin", "125 mcg", "PO", "10:00")],
    flags: { fallRisk: true },
    sbar: {
      situation: "Fast atrial fibrillation, heart rate 105–120. Started on rate control yesterday.",
      background: "76 years old, high blood pressure, mild memory problems. Lives alone.",
      assessment: "NEWS 3. Heart rate coming down slowly (112 now). No chest pain. Unsteady when walking.",
      recommendation: "Check pulse before metoprolol and digoxin. Bed alarm on. Ask family about home support for discharge planning.",
    },
    timeline: [
      ev(-1, "14:10", "admission", "Admitted from clinic", "Palpitations and dizziness, heart rate 140."),
      ev(-1, "15:00", "medication", "Rate control started", "Metoprolol and digoxin."),
      ev(0, "06:00", "test", "Morning obs", "Heart rate 112."),
    ],
  },
  "ines-moreau": {
    problems: ["Heart attack (NSTEMI), day 2", "High cholesterol", "Morphine allergy (vomiting, confusion)"],
    meds: [m("Aspirin", "75 mg", "PO", "10:00"), m("Clopidogrel", "75 mg", "PO", "10:00"), m("Atorvastatin", "80 mg", "PO", "22:00"), m("Fondaparinux", "2.5 mg", "SC", "18:00")],
    sbar: {
      situation: "Day 2 after a small heart attack. No chest pain since yesterday morning.",
      background: "69 years old. Allergic to morphine. Waiting for an angiogram slot tomorrow.",
      assessment: "NEWS 2. Feels cold (36.0 °C), warm blanket given. Eating and drinking well.",
      recommendation: "Recheck temperature in 2 hours. Consent for angiogram tomorrow. Nil by mouth from midnight.",
    },
    timeline: [
      ev(-2, "19:40", "admission", "Admitted from emergency", "Chest pain at rest, troponin raised."),
      ev(-1, "09:00", "test", "Echo", "Heart pumping well, small area moving less."),
    ],
  },
  "daniel-kim": {
    problems: ["Pericarditis (inflamed heart lining)", "Recent viral infection"],
    meds: [m("Ibuprofen", "600 mg", "PO", "06:00", "14:00", "22:00"), m("Colchicine", "500 mcg", "PO", "10:00", "22:00"), m("Omeprazole", "20 mg", "PO", "06:00")],
    dischargeToday: true,
    sbar: {
      situation: "Pericarditis, much better. Planned discharge today.",
      background: "54 years old, viral illness 2 weeks ago. Chest pain worse lying flat on admission.",
      assessment: "NEWS 0. Pain 1/10. CRP falling. Echo shows no fluid around the heart.",
      recommendation: "Discharge after doctor signs letter. Colchicine for 3 months. Clinic in 2 weeks. Avoid hard exercise for now.",
    },
    timeline: [
      ev(-3, "22:15", "admission", "Admitted from emergency", "Sharp chest pain, worse lying down."),
      ev(-2, "10:00", "test", "Echo", "No fluid around the heart."),
      ev(0, "08:30", "note", "Ward round", "Fit for discharge today."),
    ],
  },
  "margaret-shaw": {
    problems: ["Heart failure, worse breathing", "Atrial fibrillation", "Frailty, falls at home", "Do not resuscitate (DNR) order in place"],
    meds: [m("Furosemide", "80 mg", "IV", "06:00", "14:00"), m("Bisoprolol", "1.25 mg", "PO", "10:00"), m("Enoxaparin", "20 mg", "SC", "18:00"), m("Paracetamol", "1 g", "PO", "10:00", "18:00")],
    flags: { fallRisk: true, dnr: true },
    sbar: {
      situation: "Heart failure, breathing harder this morning. NEWS 5, doctor told at 07:30.",
      background: "84 years old, frail, falls at home. DNR order signed with family. Allergic to latex.",
      assessment: "Breathing rate 21, SpO2 94% on 2 L oxygen. BP low-normal (104/62). Some crackles at both lung bases.",
      recommendation: "Obs every 2 hours. Doctor review before next furosemide dose. Comfort and family update. Latex-free gloves only.",
    },
    timeline: [
      ev(-5, "13:00", "admission", "Admitted from care home", "Short of breath, swollen legs."),
      ev(-3, "10:00", "note", "Family meeting", "DNR agreed with daughter."),
      ev(0, "06:00", "medication", "Furosemide held", "Systolic BP 98 before the dose."),
      ev(0, "07:30", "note", "NEWS 5", "Doctor informed, review on morning round."),
    ],
  },
  "kofi-mensah": {
    problems: ["Bypass surgery (CABG x3), day 5", "Type 2 diabetes", "High blood pressure"],
    meds: [m("Aspirin", "75 mg", "PO", "10:00"), m("Atorvastatin", "40 mg", "PO", "22:00"), m("Metoprolol", "25 mg", "PO", "06:00", "18:00"), m("Paracetamol", "1 g", "PO", "06:00", "14:00", "22:00")],
    dischargeToday: true,
    sbar: {
      situation: "Day 5 after triple bypass surgery. Going home today.",
      background: "Moved from cardiac surgery 3 days ago. Diabetes and high blood pressure.",
      assessment: "NEWS 1. Chest wound clean, no ooze. Walking 2 laps of the ward. Blood sugar 6–9.",
      recommendation: "Discharge pack and wound-care leaflet. District nurse referral for day 10 wound check. Cardiac rehab booked.",
    },
    timeline: [
      ev(-6, "08:00", "procedure", "Bypass surgery (CABG x3)", "Uncomplicated, extubated same day."),
      ev(-3, "11:00", "admission", "Moved to Cardiac ward 4B", "From cardiac surgery high-dependency unit."),
      ev(0, "09:00", "note", "Ward round", "Fit for discharge."),
    ],
  },
  "elena-petrova": {
    problems: ["Infection of heart valve (endocarditis)", "MRSA in blood cultures", "Penicillin allergy (hives)"],
    meds: [m("Vancomycin", "1 g", "IV", "06:00", "18:00"), m("Paracetamol", "1 g", "PO", "10:00", "22:00"), m("Enoxaparin", "40 mg", "SC", "18:00")],
    flags: { isolation: "Contact (MRSA)" },
    sbar: {
      situation: "Endocarditis on IV vancomycin, day 4. Still has a fever (38.4 °C).",
      background: "47 years old. MRSA in blood cultures. Allergic to penicillin. Contact isolation in side room 14.",
      assessment: "NEWS 3. Heart rate 96. New murmur heard yesterday. Cannula site fine.",
      recommendation: "Vancomycin trough level before the 18:00 dose. Repeat blood cultures. Keep isolation, gown and gloves.",
    },
    timeline: [
      ev(-4, "18:20", "admission", "Admitted with fever", "Fever and night sweats for 2 weeks."),
      ev(-3, "12:00", "test", "Blood cultures", "MRSA growing in 3 of 3 bottles."),
      ev(-2, "10:30", "test", "Heart ultrasound (TOE)", "Small growth on the mitral valve."),
    ],
  },
  "robert-lang": {
    problems: ["Fainting episodes", "Slow heart rate (heart block)", "Arthritis"],
    meds: [m("Enoxaparin", "40 mg", "SC", "18:00"), m("Amlodipine", "5 mg", "PO", "10:00")],
    flags: { fallRisk: true },
    sbar: {
      situation: "Fainting with a slow heart rate. Waiting for a pacemaker, likely tomorrow.",
      background: "73 years old. Two faints at home this month. Arthritis in both knees.",
      assessment: "NEWS 2. Heart rate 45–50. BP 108/66. Felt dizzy standing up this morning.",
      recommendation: "Help with all walking. Hold amlodipine if systolic BP under 110. Nil by mouth from midnight for pacemaker.",
    },
    timeline: [
      ev(-1, "16:00", "admission", "Admitted from emergency", "Fainted at the supermarket."),
      ev(-1, "17:00", "test", "ECG", "Second-degree heart block."),
    ],
  },
};

function genericDetail(p: Patient): ClinicalDetail {
  return {
    problems: [p.condition],
    meds: [],
    flags: {},
    avpu: "A",
    pain: 0,
    timeline: p.ward
      ? [ev(-1, "10:00", "admission", `Admitted to ${p.ward}`, p.condition)]
      : [ev(-14, "10:00", "visit", "Clinic visit", p.condition)],
  };
}

export function clinicalDetail(p: Patient): ClinicalDetail {
  const base = genericDetail(p);
  const d = details[p.id] ?? {};
  return { ...base, ...d, flags: { ...base.flags, ...d.flags }, sbar: d.sbar ?? defaultSbar(p) };
}

function defaultSbar(p: Patient): Sbar {
  return {
    situation: `${p.condition}. ${p.status === "critical" ? "Unwell and needs close watching." : "Settled this shift."}`,
    background: `${p.age} years old. ${p.allergies.length ? `Allergies: ${p.allergies.join(", ")}.` : "No known allergies."}`,
    assessment: `NEWS ${p.news}. HR ${p.vitals.hr}, BP ${p.vitals.bp}, SpO2 ${p.vitals.spo2}%, temp ${p.vitals.temp} °C.`,
    recommendation: "Continue current plan. Routine obs.",
  };
}

/* ------------------------------------------------------------------ */
/* Lab and imaging results                                             */
/* ------------------------------------------------------------------ */

export type ResultFlag = "normal" | "high" | "low" | "critical" | "abnormal";

export interface LabResult {
  id: string;
  patientId: string;
  name: string;
  kind: "lab" | "imaging";
  value?: number;
  unit?: string;
  low?: number;
  high?: number;
  flag: ResultFlag;
  /** Hours before now when it was resulted. */
  hoursAgo: number;
  /** Older values, oldest first (labs only). */
  history?: number[];
  report?: string;
  /** Seeded as already reviewed. */
  reviewed?: boolean;
}

const lab = (id: string, patientId: string, name: string, value: number, unit: string, low: number, high: number, flag: ResultFlag, hoursAgo: number, history: number[], reviewed = false): LabResult => ({
  id, patientId, name, kind: "lab", value, unit, low, high, flag, hoursAgo, history, reviewed,
});
const img = (id: string, patientId: string, name: string, report: string, flag: ResultFlag, hoursAgo: number, reviewed = false): LabResult => ({
  id, patientId, name, kind: "imaging", report, flag, hoursAgo, reviewed,
});

export const labResults: LabResult[] = [
  lab("LR-1001", "ahmed-saleh", "Troponin I", 0.42, "ng/mL", 0, 0.04, "critical", 4, [0.03, 0.18]),
  lab("LR-1002", "ahmed-saleh", "Potassium", 3.2, "mmol/L", 3.5, 5.1, "low", 4, [3.9, 3.6]),
  img("LR-1003", "ahmed-saleh", "ECG (12-lead)", "Sinus tachycardia 116/min. ST depression 1–2 mm in V4–V6. No ST elevation.", "abnormal", 5),
  lab("LR-1004", "james-whitaker", "BNP", 1240, "pg/mL", 0, 100, "high", 6, [1820, 1510]),
  lab("LR-1005", "james-whitaker", "Creatinine", 1.6, "mg/dL", 0.6, 1.2, "high", 6, [1.3, 1.4]),
  lab("LR-1006", "james-whitaker", "Sodium", 132, "mmol/L", 135, 145, "low", 6, [136, 134]),
  img("LR-1007", "james-whitaker", "Chest X-ray", "Fluid at both lung bases. Heart shadow enlarged. No pneumonia.", "abnormal", 40, true),
  lab("LR-1008", "rosa-delgado", "Hemoglobin", 11.8, "g/dL", 12, 15.5, "low", 5, [13.1, 12.4]),
  lab("LR-1009", "rosa-delgado", "Platelets", 240, "x10⁹/L", 150, 400, "normal", 5, [255, 248], true),
  lab("LR-1010", "maya-robinson", "LDL cholesterol", 162, "mg/dL", 0, 130, "high", 26, [171, 158]),
  lab("LR-1011", "maya-robinson", "HbA1c", 5.4, "%", 4, 5.6, "normal", 26, [5.5, 5.4], true),
  lab("LR-1012", "chloe-martin", "TSH", 2.1, "mIU/L", 0.4, 4.0, "normal", 30, [1.9], true),
  img("LR-1013", "chloe-martin", "Holter monitor (48 h)", "Sinus rhythm all through. Rare single extra beats (under 1%). No pauses or fast runs.", "normal", 30),
  lab("LR-1014", "george-okoro", "Total cholesterol", 248, "mg/dL", 0, 200, "high", 20, [262, 255]),
  lab("LR-1015", "george-okoro", "Triglycerides", 210, "mg/dL", 0, 150, "high", 20, [236, 224]),
  lab("LR-1016", "george-okoro", "ALT (liver)", 31, "U/L", 7, 56, "normal", 20, [28, 30], true),
  lab("LR-1017", "margaret-shaw", "BNP", 2100, "pg/mL", 0, 100, "critical", 3, [1450, 1720]),
  lab("LR-1018", "margaret-shaw", "Potassium", 5.6, "mmol/L", 3.5, 5.1, "high", 3, [4.8, 5.2]),
  lab("LR-1019", "walter-brooks", "TSH", 0.9, "mIU/L", 0.4, 4.0, "normal", 18, [1.1]),
  lab("LR-1020", "hugo-lambert", "INR", 3.8, "", 2, 3, "high", 8, [2.6, 3.1]),
  lab("LR-1021", "kofi-mensah", "Hemoglobin", 10.4, "g/dL", 13, 17, "low", 7, [9.8, 10.1], true),
  img("LR-1022", "robert-lang", "ECG (12-lead)", "Second-degree heart block (Mobitz II). Heart rate 46/min.", "critical", 16),
  lab("LR-1023", "ines-moreau", "Troponin I", 0.09, "ng/mL", 0, 0.04, "high", 9, [0.31, 0.16]),
  img("LR-1024", "sofia-almeida", "Exercise ECG", "Stopped at 7 minutes for tiredness. Mild ST changes at peak, no chest pain.", "abnormal", 50),
];

export const flagLetters: Record<ResultFlag, string> = { normal: "N", high: "H", low: "L", critical: "!!", abnormal: "A" };
export const flagLabels: Record<ResultFlag, string> = { normal: "Normal", high: "High", low: "Low", critical: "Critical", abnormal: "Abnormal" };

/* ------------------------------------------------------------------ */
/* Doctor schedule                                                      */
/* ------------------------------------------------------------------ */

export type SlotType = "clinic" | "video" | "procedure" | "ward" | "blocked";
export type VisitStatus = "upcoming" | "checked-in" | "completed" | "no-show";

export interface ScheduleTemplate {
  time: string;
  duration: number;
  type: SlotType;
  patientId?: string;
  reason: string;
  /** Marked as a no-show once the slot is in the past. */
  noShow?: boolean;
}

export const todayTemplate: ScheduleTemplate[] = [
  { time: "07:30", duration: 60, type: "ward", reason: "Ward round, Cardiac ward 4B" },
  { time: "08:30", duration: 30, type: "clinic", patientId: "george-okoro", reason: "Cholesterol results review" },
  { time: "09:00", duration: 30, type: "clinic", patientId: "sofia-almeida", reason: "New patient: chest tightness" },
  { time: "09:30", duration: 30, type: "video", patientId: "chloe-martin", reason: "Holter results" },
  { time: "10:00", duration: 30, type: "clinic", patientId: "hugo-lambert", reason: "Warfarin and INR review" },
  { time: "10:30", duration: 30, type: "clinic", patientId: "nadia-farouk", reason: "Echo follow-up", noShow: true },
  { time: "11:30", duration: 30, type: "video", patientId: "tariq-hassan", reason: "Angina medicine review" },
  { time: "13:00", duration: 60, type: "procedure", patientId: "ahmed-saleh", reason: "Coronary angiogram, cath lab 2" },
  { time: "14:00", duration: 30, type: "clinic", patientId: "beatrice-owusu", reason: "Valve yearly review" },
  { time: "15:00", duration: 30, type: "video", patientId: "liam-oconnell", reason: "Home BP readings" },
  { time: "16:30", duration: 30, type: "clinic", patientId: "ruth-adeyemi", reason: "Short of breath on stairs" },
];

const otherSlots = ["08:30", "09:00", "09:30", "10:30", "11:00", "11:30", "14:00", "14:30", "15:30", "16:00", "16:30"];
const clinicPool = ["maya-robinson", "chloe-martin", "george-okoro", "sofia-almeida", "hugo-lambert", "nadia-farouk", "tariq-hassan", "beatrice-owusu", "liam-oconnell", "ruth-adeyemi"];
const reasons = ["Follow-up visit", "Results review", "Medicine review", "BP check", "Echo follow-up", "New patient visit"];

/** Template for any day that is not today. `offset` = days from today, `weekday` 0 = Sunday. */
export function templateForDay(offset: number, weekday: number): ScheduleTemplate[] {
  if (offset === 0) return todayTemplate;
  if (weekday === 0) return [];
  if (weekday === 6) {
    return [
      { time: "09:00", duration: 30, type: "clinic", patientId: clinicPool[Math.abs(offset) % clinicPool.length], reason: "Saturday clinic" },
      { time: "10:00", duration: 30, type: "video", patientId: clinicPool[(Math.abs(offset) + 3) % clinicPool.length], reason: "Results review" },
    ];
  }
  const count = [6, 7, 5, 8, 6][Math.abs(offset + weekday) % 5];
  const slots = otherSlots.filter((_, j) => (j + Math.abs(offset)) % 4 !== 0).slice(0, count);
  const items: ScheduleTemplate[] = [{ time: "07:30", duration: 60, type: "ward", reason: "Ward round, Cardiac ward 4B" }];
  slots.forEach((time, i) => {
    const k = Math.abs(offset * 3 + i);
    items.push({
      time,
      duration: 30,
      type: (i + offset) % 3 === 0 ? "video" : "clinic",
      patientId: clinicPool[k % clinicPool.length],
      reason: reasons[k % reasons.length],
    });
  });
  if (weekday === 3) items.push({ time: "12:00", duration: 90, type: "procedure", reason: "Cath lab list" });
  return items;
}

/* ------------------------------------------------------------------ */
/* Nurse shift tasks                                                    */
/* ------------------------------------------------------------------ */

export interface ShiftTask {
  id: string;
  label: string;
  time: string;
  patientId?: string;
  priority: "urgent" | "routine";
}

export const shiftTasks: ShiftTask[] = [
  { id: "t-huddle", label: "Safety huddle with the day team", time: "07:30", priority: "routine" },
  { id: "t-crash", label: "Check crash cart and defibrillator", time: "08:00", priority: "routine" },
  { id: "t-weights", label: "Daily weights for heart failure patients (beds 08, 12)", time: "08:00", priority: "routine" },
  { id: "t-trop", label: "Repeat troponin and ECG, bed 03", time: "12:40", patientId: "ahmed-saleh", priority: "urgent" },
  { id: "t-npo", label: "Prepare bed 03 for angiogram (consent, cannula, nil by mouth)", time: "12:30", patientId: "ahmed-saleh", priority: "urgent" },
  { id: "t-vanc", label: "Vancomycin level before 18:00 dose, bed 14", time: "17:30", patientId: "elena-petrova", priority: "urgent" },
  { id: "t-wound", label: "Sternal wound check and dressing, bed 10", time: "11:00", patientId: "kofi-mensah", priority: "routine" },
  { id: "t-discharge", label: "Discharge paperwork and medicines, beds 05 and 10", time: "14:00", priority: "routine" },
  { id: "t-falls", label: "Falls risk reassessment, beds 01, 03, 08, 12, 15", time: "15:00", priority: "routine" },
  { id: "t-fluid", label: "Update fluid balance charts", time: "18:00", priority: "routine" },
];
