"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { rollingDates } from "@/lib/persist";
import type { Avpu, Sbar, VisitStatus } from "@/data/clinical";
import { daysFromNow, makeRef } from "@/lib/dates";

/**
 * Clinical work for the doctor and nurse dashboards: visit notes, reviewed
 * results, schedule changes, vitals the nurse records, medicine doses given,
 * shift tasks and handover sign-offs. Shared, so a nurse's vitals show on the
 * doctor's patient chart.
 */

export interface VisitNote {
  id: string;
  patientId: string;
  authorName: string;
  type: "Clinic visit" | "Video visit" | "Ward round" | "Procedure";
  status: "draft" | "signed";
  createdAt: string;
  updatedAt: string;
  signedAt?: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface VitalsEntry {
  id: string;
  patientId: string;
  at: string;
  by: string;
  hr: number;
  sys: number;
  dia: number;
  spo2: number;
  temp: number;
  rr: number;
  avpu: Avpu;
  pain: number;
  onOxygen: boolean;
  news: number;
}

export interface ScheduleBlock {
  id: string;
  start: string;
  duration: number;
  reason: string;
}

export interface DoseRecord {
  status: "given" | "held" | "missed";
  at: string;
  by: string;
  reason?: string;
}

export interface HandoverRecord {
  id: string;
  ward: string;
  from: string;
  to: string;
  signedAt: string;
  patientIds: string[];
  note?: string;
}

interface ClinicalState {
  notes: VisitNote[];
  reviewed: Record<string, string>;
  visitStatus: Record<string, VisitStatus>;
  blocks: ScheduleBlock[];
  vitals: VitalsEntry[];
  /** Keyed by `${YYYY-MM-DD}:${doseId}` so each day starts fresh. */
  doses: Record<string, DoseRecord>;
  /** Shift task id → time done. */
  tasks: Record<string, string>;
  sbar: Record<string, Sbar>;
  handovers: HandoverRecord[];
  saveNote: (note: Omit<VisitNote, "id" | "createdAt" | "updatedAt" | "status" | "signedAt"> & { id?: string }, sign?: boolean) => string;
  signNote: (id: string) => void;
  markReviewed: (id: string) => void;
  setVisitStatus: (id: string, status: VisitStatus) => void;
  addBlock: (block: Omit<ScheduleBlock, "id">) => void;
  removeBlock: (id: string) => void;
  addVitals: (entry: Omit<VitalsEntry, "id" | "at">) => void;
  setDose: (key: string, record: DoseRecord) => void;
  toggleTask: (id: string) => void;
  setSbar: (patientId: string, sbar: Sbar) => void;
  signHandover: (record: Omit<HandoverRecord, "id" | "signedAt">) => void;
  reset: () => void;
}

const DOCTOR = "Dr. Layla Haddad";

function seedNotes(): VisitNote[] {
  const n = (id: string, patientId: string, type: VisitNote["type"], status: VisitNote["status"], at: string, s: string, o: string, a: string, p: string): VisitNote => ({
    id,
    patientId,
    authorName: DOCTOR,
    type,
    status,
    createdAt: at,
    updatedAt: at,
    signedAt: status === "signed" ? at : undefined,
    subjective: s,
    objective: o,
    assessment: a,
    plan: p,
  });
  return [
    n("NOTE-7101", "ahmed-saleh", "Ward round", "draft", daysFromNow(0, "07:50"),
      "Central chest pain since 05:00, now 4/10 after GTN spray. Short of breath. Says he feels \"not right\".",
      "HR 118, BP 96/60, SpO2 91% on air, temp 37.9 °C, RR 24. Pale, sweaty. Chest clear. ECG: ST depression V4–V6. Troponin I 0.42.",
      "Likely NSTEMI with signs of strain. NEWS 7. Aspirin allergy.",
      "Clopidogrel 75 mg, fondaparinux. Oxygen to keep SpO2 94–98%. Angiogram today at 13:00. Repeat troponin and ECG at 12:40. Hourly obs."),
    n("NOTE-7102", "james-whitaker", "Ward round", "draft", daysFromNow(0, "08:10"),
      "Breathing a little better. Slept with 2 pillows (was 4). Still has swollen ankles.",
      "HR 96, BP 142/88, SpO2 93%, RR 20. Crackles at both bases. Weight down 1.2 kg. Creatinine 1.6 (from 1.3).",
      "Heart failure with fluid overload, slowly improving. Kidneys a little stressed by diuretics.",
      "Keep IV furosemide 40 mg twice a day for 24 h more. Fluid limit 1.5 L. Repeat kidney bloods tomorrow. Review spironolactone if potassium rises."),
    n("NOTE-7103", "chloe-martin", "Video visit", "draft", daysFromNow(-1, "16:20"),
      "Palpitations at night, 2–3 times a week, lasting a few seconds. No fainting. Drinks 4 coffees a day.",
      "Holter: sinus rhythm, rare single extra beats (under 1%), no pauses. TSH normal.",
      "Benign extra heartbeats, likely made worse by caffeine and stress.",
      "Reassured. Cut down caffeine. Breathing exercises. Return if fainting or long episodes. No follow-up needed."),
    n("NOTE-7090", "rosa-delgado", "Ward round", "signed", daysFromNow(-1, "08:40"),
      "No chest pain. Walking to the bathroom alone. Wants to go home.",
      "HR 78, BP 124/76, SpO2 97%. Right wrist site clean. Hb 12.4.",
      "Day 2 after stent to the RCA, recovering well.",
      "Continue dual antiplatelets for 12 months. Cardiac rehab referral. Plan home in 1–2 days."),
    n("NOTE-7088", "kofi-mensah", "Ward round", "signed", daysFromNow(-1, "09:10"),
      "Chest wound a bit sore. Eating well.",
      "HR 84, BP 118/72, afebrile. Sternal wound clean. Hb 10.1.",
      "Day 4 after CABG, recovering as expected. Mild anemia after surgery.",
      "Iron tablets on discharge. Home tomorrow if stable. District nurse for wound check."),
    n("NOTE-7051", "maya-robinson", "Clinic visit", "signed", daysFromNow(-30, "09:50"),
      "Home BP readings around 140/90. Headaches some mornings. Family history: father had a heart attack at 52.",
      "BP 138/88, HR 72, BMI 26. Heart sounds normal.",
      "Stage 1 high blood pressure. Raised LDL.",
      "Lifestyle plan (salt, exercise, sleep). Home BP twice a day. Review in 4 weeks with readings."),
  ];
}

export const useClinical = create<ClinicalState>()(
  persist(
    (set) => ({
      notes: seedNotes(),
      reviewed: {},
      visitStatus: {},
      blocks: [],
      vitals: [],
      doses: {},
      tasks: {},
      sbar: {},
      handovers: [],
      saveNote: (note, sign) => {
        const now = new Date().toISOString();
        const id = note.id ?? makeRef("NOTE");
        set((s) => {
          const existing = s.notes.find((n) => n.id === id);
          const next: VisitNote = {
            ...note,
            id,
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
            status: sign ? "signed" : "draft",
            signedAt: sign ? now : undefined,
          };
          return { notes: existing ? s.notes.map((n) => (n.id === id ? next : n)) : [next, ...s.notes] };
        });
        return id;
      },
      signNote: (id) =>
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, status: "signed", signedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : n)),
        })),
      markReviewed: (id) => set((s) => ({ reviewed: { ...s.reviewed, [id]: new Date().toISOString() } })),
      setVisitStatus: (id, status) => set((s) => ({ visitStatus: { ...s.visitStatus, [id]: status } })),
      addBlock: (block) => set((s) => ({ blocks: [...s.blocks, { ...block, id: makeRef("BLK") }] })),
      removeBlock: (id) => set((s) => ({ blocks: s.blocks.filter((b) => b.id !== id) })),
      addVitals: (entry) => set((s) => ({ vitals: [...s.vitals, { ...entry, id: makeRef("VIT"), at: new Date().toISOString() }] })),
      setDose: (key, record) => set((s) => ({ doses: { ...s.doses, [key]: record } })),
      toggleTask: (id) =>
        set((s) => {
          const tasks = { ...s.tasks };
          if (tasks[id]) delete tasks[id];
          else tasks[id] = new Date().toISOString();
          return { tasks };
        }),
      setSbar: (patientId, sbar) => set((s) => ({ sbar: { ...s.sbar, [patientId]: sbar } })),
      signHandover: (record) =>
        set((s) => ({ handovers: [{ ...record, id: makeRef("HO"), signedAt: new Date().toISOString() }, ...s.handovers] })),
      reset: () => set({ notes: seedNotes(), reviewed: {}, visitStatus: {}, blocks: [], vitals: [], doses: {}, tasks: {}, sbar: {}, handovers: [] }),
    }),
    { name: "aurelia-clinical", version: 1, storage: rollingDates() },
  ),
);
