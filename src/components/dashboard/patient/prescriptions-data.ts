/** Made-up medicines for the demo patient. `productId` links to the marketplace when we sell it. */

import { daysFromNow } from "@/lib/dates";

export interface Medicine {
  id: string;
  name: string;
  dose: string;
  schedule: string;
  reason: string;
  doctorId: string;
  startedAt: string;
  refillsLeft: number;
  refillsTotal: number;
  /** Days of tablets left out of a 30-day pack. */
  daysLeft: number;
  nextRefill: string;
  productId?: string;
  reminderTimes: string[];
}

export interface PastMedicine {
  id: string;
  name: string;
  dose: string;
  doctorId: string;
  from: string;
  to: string;
  stopReason: string;
}

export const activeMedicines: Medicine[] = [
  {
    id: "amlodipine",
    name: "Amlodipine",
    dose: "5 mg tablet",
    schedule: "1 tablet every morning",
    reason: "Blood pressure",
    doctorId: "layla-haddad",
    startedAt: daysFromNow(-30),
    refillsLeft: 4,
    refillsTotal: 5,
    daysLeft: 6,
    nextRefill: daysFromNow(4),
    reminderTimes: ["08:00"],
  },
  {
    id: "atorvastatin",
    name: "Atorvastatin",
    dose: "20 mg tablet",
    schedule: "1 tablet at night",
    reason: "Cholesterol",
    doctorId: "layla-haddad",
    startedAt: daysFromNow(-18),
    refillsLeft: 5,
    refillsTotal: 5,
    daysLeft: 12,
    nextRefill: daysFromNow(10),
    productId: "atorvastatin",
    reminderTimes: ["21:30"],
  },
  {
    id: "vitamin-d3",
    name: "Vitamin D3",
    dose: "1,000 IU capsule",
    schedule: "1 capsule daily with food",
    reason: "Low vitamin D",
    doctorId: "thomas-weber",
    startedAt: daysFromNow(-60),
    refillsLeft: 1,
    refillsTotal: 2,
    daysLeft: 22,
    nextRefill: daysFromNow(20),
    reminderTimes: ["13:00"],
  },
];

export const pastMedicines: PastMedicine[] = [
  { id: "lisinopril", name: "Lisinopril", dose: "10 mg tablet", doctorId: "layla-haddad", from: daysFromNow(-58), to: daysFromNow(-30), stopReason: "Dry cough. Switched to amlodipine." },
  { id: "ibuprofen", name: "Ibuprofen", dose: "400 mg tablet", doctorId: "thomas-weber", from: daysFromNow(-80), to: daysFromNow(-62), stopReason: "Can raise blood pressure. Use paracetamol instead." },
  { id: "chlorhexidine", name: "Chlorhexidine mouthwash", dose: "0.12%, 15 mL", doctorId: "omar-khalil", from: daysFromNow(-45), to: daysFromNow(-38), stopReason: "Course finished after dental treatment." },
];
