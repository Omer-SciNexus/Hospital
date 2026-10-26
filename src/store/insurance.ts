"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { rollingDates } from "@/lib/persist";
import { DEMO_PATIENT_ID } from "@/data/patients";
import { daysFromNow, makeRef } from "@/lib/dates";

/**
 * Insurance flow shared by the patient and billing dashboards:
 * patient adds a card → billing verifies it → coverage shows at booking and
 * checkout → claims are sent by billing → patient sees approved / denied.
 * Pre-approvals follow the same request → decision path.
 */

export type CardStatus = "pending" | "verified" | "rejected";
export type ClaimStatus = "draft" | "submitted" | "in-review" | "approved" | "partial" | "denied";
export type PreapprovalStatus = "requested" | "in-review" | "approved" | "denied";

export interface InsuranceCard {
  id: string;
  patientId: string;
  insurerId: string;
  plan: string;
  memberId: string;
  groupNumber: string;
  holder: string;
  primary: boolean;
  status: CardStatus;
  addedAt: string;
  decidedAt?: string;
  /** Reason shown to the patient when a card is rejected. */
  note?: string;
  /** File name of the uploaded card photo, if any. */
  photo?: string;
}

export interface Claim {
  id: string;
  patientId: string;
  insurerId: string;
  title: string;
  source: "order" | "appointment" | "procedure";
  /** Order, appointment or pre-approval reference. */
  refId: string;
  amount: number;
  /** Amount the plan is expected to pay; updated with the decision. */
  insurerPays: number;
  status: ClaimStatus;
  createdAt: string;
  submittedAt?: string;
  decidedAt?: string;
  reason?: string;
}

export interface Preapproval {
  id: string;
  patientId: string;
  insurerId: string;
  procedure: string;
  doctorId: string;
  department: string;
  estimatedCost: number;
  urgency: "routine" | "urgent";
  status: PreapprovalStatus;
  requestedAt: string;
  decidedAt?: string;
  note?: string;
}

interface InsuranceState {
  cards: InsuranceCard[];
  claims: Claim[];
  preapprovals: Preapproval[];
  addCard: (card: Omit<InsuranceCard, "id" | "status" | "addedAt" | "primary"> & { primary?: boolean }) => string;
  removeCard: (id: string) => void;
  setPrimary: (id: string) => void;
  decideCard: (id: string, status: "verified" | "rejected", note?: string) => void;
  createClaim: (claim: Omit<Claim, "id" | "status" | "createdAt">) => string;
  submitClaim: (id: string) => void;
  decideClaim: (id: string, status: "in-review" | "approved" | "partial" | "denied", opts?: { insurerPays?: number; reason?: string }) => void;
  requestPreapproval: (p: Omit<Preapproval, "id" | "status" | "requestedAt">) => string;
  decidePreapproval: (id: string, status: "in-review" | "approved" | "denied", note?: string) => void;
  reset: () => void;
}

function seed(): Pick<InsuranceState, "cards" | "claims" | "preapprovals"> {
  return {
    cards: [
      { id: "card-maya-1", patientId: DEMO_PATIENT_ID, insurerId: "northwind", plan: "PPO", memberId: "NWH-4471-0932", groupNumber: "GRP-22018", holder: "Maya Robinson", primary: true, status: "verified", addedAt: daysFromNow(-120), decidedAt: daysFromNow(-119) },
      { id: "card-james", patientId: "james-whitaker", insurerId: "brightpath", plan: "Medicare Advantage", memberId: "BPH-1180-5521", groupNumber: "GRP-90112", holder: "James Whitaker", primary: true, status: "pending", addedAt: daysFromNow(0, "07:42") },
      { id: "card-chloe", patientId: "chloe-martin", insurerId: "evergreen", plan: "HMO", memberId: "ECP-7730-1182", groupNumber: "GRP-41107", holder: "Chloe Martin", primary: true, status: "pending", addedAt: daysFromNow(-1, "16:10") },
      { id: "card-zara", patientId: "zara-ali", insurerId: "pinecrest", plan: "EPO", memberId: "PCS-0045-7781", groupNumber: "GRP-33090", holder: "Zara Ali", primary: true, status: "pending", addedAt: daysFromNow(-1, "11:25") },
      { id: "card-rosa", patientId: "rosa-delgado", insurerId: "harborline", plan: "PPO", memberId: "HBM-2290-4410", groupNumber: "GRP-11873", holder: "Rosa Delgado", primary: true, status: "verified", addedAt: daysFromNow(-9), decidedAt: daysFromNow(-9) },
      { id: "card-george", patientId: "george-okoro", insurerId: "solace", plan: "PPO", memberId: "SOL-8823-0019", groupNumber: "GRP-50021", holder: "George Okoro", primary: true, status: "rejected", addedAt: daysFromNow(-6), decidedAt: daysFromNow(-5), note: "Member ID does not match the insurer's records. Please re-upload the front of the card." },
      { id: "card-victor", patientId: "victor-hale", insurerId: "northwind", plan: "HMO", memberId: "NWH-5512-7710", groupNumber: "GRP-22018", holder: "Victor Hale", primary: true, status: "verified", addedAt: daysFromNow(-14), decidedAt: daysFromNow(-13) },
    ],
    claims: [
      { id: "CLM-30411", patientId: DEMO_PATIENT_ID, insurerId: "northwind", title: "Cardiology visit, Dr. Layla Haddad", source: "appointment", refId: "APT-20931", amount: 120, insurerPays: 96, status: "approved", createdAt: daysFromNow(-30), submittedAt: daysFromNow(-30), decidedAt: daysFromNow(-26) },
      { id: "CLM-30588", patientId: DEMO_PATIENT_ID, insurerId: "northwind", title: "Heart Health Screen", source: "order", refId: "ORD-51842", amount: 249, insurerPays: 149, status: "partial", createdAt: daysFromNow(-21), submittedAt: daysFromNow(-20), decidedAt: daysFromNow(-15), reason: "Echocardiogram covered; package discount items paid by patient." },
      { id: "CLM-30702", patientId: DEMO_PATIENT_ID, insurerId: "northwind", title: "Smart Blood Pressure Monitor", source: "order", refId: "ORD-52210", amount: 59, insurerPays: 30, status: "submitted", createdAt: daysFromNow(-3), submittedAt: daysFromNow(-2) },
      { id: "CLM-30655", patientId: DEMO_PATIENT_ID, insurerId: "northwind", title: "Teeth whitening", source: "appointment", refId: "APT-20877", amount: 180, insurerPays: 0, status: "denied", createdAt: daysFromNow(-45), submittedAt: daysFromNow(-44), decidedAt: daysFromNow(-40), reason: "Cosmetic procedures are not covered by this plan." },
      { id: "CLM-30715", patientId: "rosa-delgado", insurerId: "harborline", title: "Coronary stent and 3-day stay", source: "procedure", refId: "PA-7731", amount: 18400, insurerPays: 15640, status: "in-review", createdAt: daysFromNow(-1), submittedAt: daysFromNow(-1) },
      { id: "CLM-30719", patientId: "victor-hale", insurerId: "northwind", title: "Knee replacement", source: "procedure", refId: "PA-7702", amount: 24500, insurerPays: 19600, status: "submitted", createdAt: daysFromNow(-2), submittedAt: daysFromNow(-2) },
      { id: "CLM-30722", patientId: "hannah-berg", insurerId: "brightpath", title: "Chemotherapy cycle 3", source: "procedure", refId: "PA-7690", amount: 6200, insurerPays: 5580, status: "draft", createdAt: daysFromNow(0, "08:15") },
      { id: "CLM-30724", patientId: "frank-miller", insurerId: "cobalt", title: "Inpatient stay, pneumonia (4 nights)", source: "procedure", refId: "ADM-1190", amount: 7800, insurerPays: 6240, status: "draft", createdAt: daysFromNow(0, "09:02") },
      { id: "CLM-30726", patientId: "olivia-grant", insurerId: "harborline", title: "Delivery and maternity stay", source: "procedure", refId: "ADM-1194", amount: 9100, insurerPays: 7735, status: "submitted", createdAt: daysFromNow(-1), submittedAt: daysFromNow(0, "07:30") },
      { id: "CLM-30690", patientId: "george-okoro", insurerId: "solace", title: "Lipid profile + consult", source: "appointment", refId: "APT-21003", amount: 145, insurerPays: 0, status: "denied", createdAt: daysFromNow(-8), submittedAt: daysFromNow(-8), decidedAt: daysFromNow(-4), reason: "Card not verified at time of service." },
    ],
    preapprovals: [
      { id: "PA-7745", patientId: DEMO_PATIENT_ID, insurerId: "northwind", procedure: "Cardiac MRI", doctorId: "layla-haddad", department: "cardiology", estimatedCost: 1450, urgency: "routine", status: "in-review", requestedAt: daysFromNow(-2) },
      { id: "PA-7752", patientId: "james-whitaker", insurerId: "brightpath", procedure: "Echocardiogram with contrast", doctorId: "layla-haddad", department: "cardiology", estimatedCost: 890, urgency: "urgent", status: "requested", requestedAt: daysFromNow(0, "08:40") },
      { id: "PA-7749", patientId: "lily-tran", insurerId: "orion", procedure: "Allergy panel and spirometry", doctorId: "mei-lin-chen", department: "pediatrics", estimatedCost: 420, urgency: "routine", status: "requested", requestedAt: daysFromNow(-1) },
      { id: "PA-7731", patientId: "rosa-delgado", insurerId: "harborline", procedure: "Coronary angioplasty and stent", doctorId: "layla-haddad", department: "cardiology", estimatedCost: 18400, urgency: "urgent", status: "approved", requestedAt: daysFromNow(-5), decidedAt: daysFromNow(-5), note: "Approved under urgent cardiac pathway." },
      { id: "PA-7702", patientId: "victor-hale", insurerId: "northwind", procedure: "Total knee replacement", doctorId: "arjun-mehta", department: "orthopedics", estimatedCost: 24500, urgency: "routine", status: "approved", requestedAt: daysFromNow(-25), decidedAt: daysFromNow(-20) },
      { id: "PA-7688", patientId: "zara-ali", insurerId: "pinecrest", procedure: "Laser skin treatment", doctorId: "amara-nwosu", department: "dermatology", estimatedCost: 950, urgency: "routine", status: "denied", requestedAt: daysFromNow(-12), decidedAt: daysFromNow(-9), note: "Treatment considered cosmetic under this plan." },
    ],
  };
}

export const useInsurance = create<InsuranceState>()(
  persist(
    (set) => ({
      ...seed(),
      addCard: (card) => {
        const id = makeRef("CARD");
        set((s) => {
          const mine = s.cards.filter((c) => c.patientId === card.patientId);
          const primary = card.primary ?? mine.length === 0;
          return {
            cards: [
              ...s.cards.map((c) => (primary && c.patientId === card.patientId ? { ...c, primary: false } : c)),
              { ...card, id, primary, status: "pending", addedAt: new Date().toISOString() },
            ],
          };
        });
        return id;
      },
      removeCard: (id) => set((s) => ({ cards: s.cards.filter((c) => c.id !== id) })),
      setPrimary: (id) =>
        set((s) => {
          const target = s.cards.find((c) => c.id === id);
          if (!target) return s;
          return { cards: s.cards.map((c) => (c.patientId === target.patientId ? { ...c, primary: c.id === id } : c)) };
        }),
      decideCard: (id, status, note) =>
        set((s) => ({
          cards: s.cards.map((c) => (c.id === id ? { ...c, status, note, decidedAt: new Date().toISOString() } : c)),
        })),
      createClaim: (claim) => {
        const id = makeRef("CLM");
        set((s) => ({ claims: [{ ...claim, id, status: "draft", createdAt: new Date().toISOString() }, ...s.claims] }));
        return id;
      },
      submitClaim: (id) =>
        set((s) => ({
          claims: s.claims.map((c) => (c.id === id ? { ...c, status: "submitted", submittedAt: new Date().toISOString() } : c)),
        })),
      decideClaim: (id, status, opts) =>
        set((s) => ({
          claims: s.claims.map((c) =>
            c.id === id
              ? {
                  ...c,
                  status,
                  reason: opts?.reason ?? c.reason,
                  insurerPays: status === "denied" ? 0 : (opts?.insurerPays ?? c.insurerPays),
                  decidedAt: status === "in-review" ? c.decidedAt : new Date().toISOString(),
                }
              : c,
          ),
        })),
      requestPreapproval: (p) => {
        const id = makeRef("PA");
        set((s) => ({ preapprovals: [{ ...p, id, status: "requested", requestedAt: new Date().toISOString() }, ...s.preapprovals] }));
        return id;
      },
      decidePreapproval: (id, status, note) =>
        set((s) => ({
          preapprovals: s.preapprovals.map((p) =>
            p.id === id ? { ...p, status, note: note ?? p.note, decidedAt: status === "in-review" ? p.decidedAt : new Date().toISOString() } : p,
          ),
        })),
      reset: () => set(seed()),
    }),
    { name: "aurelia-insurance", version: 1, storage: rollingDates() },
  ),
);

/** The patient's primary card, whatever its status. */
export const selectPrimaryCard = (patientId: string) => (s: InsuranceState) =>
  s.cards.find((c) => c.patientId === patientId && c.primary) ?? s.cards.find((c) => c.patientId === patientId);
