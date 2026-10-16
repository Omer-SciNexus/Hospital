"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { rollingDates } from "@/lib/persist";
import { DEMO_PATIENT_ID } from "@/data/patients";
import { daysFromNow, makeRef } from "@/lib/dates";

/**
 * Appointments for the demo patient (and anyone else booked through the
 * doctor pages). The booking widget on /doctors/[id] adds to this store.
 */

export type AppointmentStatus = "upcoming" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  /** ISO date-time of the visit start. */
  start: string;
  mode: "clinic" | "video";
  status: AppointmentStatus;
  reason: string;
  fee: number;
  youPay: number;
  insurerId?: string;
  /** Short summary written by the doctor after the visit. */
  summary?: string;
}

interface AppointmentsState {
  appointments: Appointment[];
  book: (a: Omit<Appointment, "id" | "status">) => string;
  cancel: (id: string) => void;
  reschedule: (id: string, start: string) => void;
  reset: () => void;
}

function seed(): Appointment[] {
  return [
    { id: "APT-21140", patientId: DEMO_PATIENT_ID, doctorId: "layla-haddad", start: daysFromNow(2, "10:30"), mode: "clinic", status: "upcoming", reason: "Blood pressure follow-up", fee: 120, youPay: 24, insurerId: "northwind" },
    { id: "APT-21162", patientId: DEMO_PATIENT_ID, doctorId: "amara-nwosu", start: daysFromNow(6, "16:00"), mode: "video", status: "upcoming", reason: "Skin rash check", fee: 75, youPay: 15, insurerId: "northwind" },
    { id: "APT-20931", patientId: DEMO_PATIENT_ID, doctorId: "layla-haddad", start: daysFromNow(-30, "09:30"), mode: "clinic", status: "completed", reason: "New patient visit", fee: 120, youPay: 24, insurerId: "northwind", summary: "BP 138/88. Started lifestyle plan, home BP monitoring twice a day, review in 4 weeks." },
    { id: "APT-20902", patientId: DEMO_PATIENT_ID, doctorId: "thomas-weber", start: daysFromNow(-62, "14:00"), mode: "video", status: "completed", reason: "Annual check", fee: 95, youPay: 19, insurerId: "northwind", summary: "Healthy overall. Ordered heart health screen because of family history." },
    { id: "APT-20877", patientId: DEMO_PATIENT_ID, doctorId: "omar-khalil", start: daysFromNow(-45, "11:00"), mode: "clinic", status: "completed", reason: "Teeth whitening", fee: 180, youPay: 180 },
    { id: "APT-20950", patientId: DEMO_PATIENT_ID, doctorId: "mei-lin-chen", start: daysFromNow(-12, "17:30"), mode: "video", status: "cancelled", reason: "Nephew's fever (booked for family)", fee: 65, youPay: 13, insurerId: "northwind" },
  ];
}

export const useAppointments = create<AppointmentsState>()(
  persist(
    (set) => ({
      appointments: seed(),
      book: (a) => {
        const id = makeRef("APT");
        set((s) => ({ appointments: [{ ...a, id, status: "upcoming" }, ...s.appointments] }));
        return id;
      },
      cancel: (id) => set((s) => ({ appointments: s.appointments.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a)) })),
      reschedule: (id, start) => set((s) => ({ appointments: s.appointments.map((a) => (a.id === id ? { ...a, start } : a)) })),
      reset: () => set({ appointments: seed() }),
    }),
    { name: "aurelia-appointments", version: 1, storage: rollingDates() },
  ),
);
