import type { Order } from "@/store/orders";
import type { Patient } from "@/data/patients";

/**
 * Simple safety checks for the Rx review screen: allergy matches and a few
 * well-known drug interactions against the patient's current medicines.
 * Demo rules only, not clinical advice.
 */

export interface RxWarning {
  kind: "allergy" | "interaction" | "age";
  title: string;
  detail: string;
}

/** Medicines already on file for each patient (made up). */
export const currentMedicines: Record<string, string[]> = {
  "maya-robinson": ["Amlodipine 5 mg daily"],
  "james-whitaker": ["Furosemide 40 mg daily", "Bisoprolol 5 mg daily", "Clarithromycin 500 mg twice daily (started 2 days ago)"],
  "rosa-delgado": ["Aspirin 81 mg daily", "Clopidogrel 75 mg daily", "Atorvastatin 40 mg nightly"],
  "ahmed-saleh": ["Heparin infusion"],
  "george-okoro": ["Gemfibrozil 600 mg twice daily"],
  "lily-tran": ["Budesonide inhaler 200 mcg twice daily"],
  "victor-hale": ["Enoxaparin 40 mg daily", "Paracetamol 1 g as needed"],
  "hannah-berg": ["Ondansetron 4 mg as needed"],
  "frank-miller": ["Lisinopril 10 mg daily"],
  "zara-ali": ["Hydrocortisone 1% cream"],
};

const allergyRules: { allergy: RegExp; drugs: RegExp; title: string; detail: string }[] = [
  {
    allergy: /penicillin/i,
    drugs: /amoxicillin|ampicillin|penicillin|co-amoxiclav/i,
    title: "Penicillin allergy",
    detail: "This medicine is a penicillin. Do not dispense. Ask the prescriber for a non-penicillin option such as clarithromycin.",
  },
  {
    allergy: /aspirin/i,
    drugs: /aspirin|ibuprofen|naproxen|diclofenac/i,
    title: "Aspirin allergy",
    detail: "Aspirin and other NSAIDs can cause the same reaction. Check with the prescriber before dispensing.",
  },
  {
    allergy: /sulfa/i,
    drugs: /sulfamethoxazole|co-trimoxazole|sulfasalazine/i,
    title: "Sulfa allergy",
    detail: "This medicine contains a sulfonamide. Confirm the allergy type with the patient and prescriber.",
  },
];

const interactionRules: { a: RegExp; b: RegExp; title: string; detail: string }[] = [
  {
    a: /atorvastatin|simvastatin/i,
    b: /clarithromycin|erythromycin/i,
    title: "Statin + clarithromycin",
    detail: "Clarithromycin raises statin levels and the risk of muscle damage. Suggest pausing the statin until the antibiotic course ends.",
  },
  {
    a: /atorvastatin|simvastatin/i,
    b: /gemfibrozil/i,
    title: "Statin + gemfibrozil",
    detail: "Higher risk of muscle damage when used together. Confirm the dose and plan with the prescriber.",
  },
  {
    a: /ibuprofen|naproxen|aspirin/i,
    b: /enoxaparin|heparin|clopidogrel|warfarin/i,
    title: "NSAID + blood thinner",
    detail: "Bleeding risk is higher. Paracetamol is usually a safer choice for pain.",
  },
  {
    a: /metformin/i,
    b: /contrast/i,
    title: "Metformin + contrast scan",
    detail: "Metformin is often paused around scans with iodine contrast. Check the scan date.",
  },
];

export function rxWarnings(order: Order, patient?: Patient): RxWarning[] {
  if (!patient) return [];
  const names = order.lines.map((l) => l.name);
  const meds = currentMedicines[patient.id] ?? [];
  const warnings: RxWarning[] = [];

  for (const allergy of patient.allergies) {
    for (const rule of allergyRules) {
      const hit = names.find((n) => rule.allergy.test(allergy) && rule.drugs.test(n));
      if (hit) warnings.push({ kind: "allergy", title: rule.title, detail: `${hit}: ${rule.detail}` });
    }
  }

  for (const rule of interactionRules) {
    const inOrder = names.find((n) => rule.a.test(n)) ?? names.find((n) => rule.b.test(n));
    if (!inOrder) continue;
    const other = rule.a.test(inOrder) ? rule.b : rule.a;
    const clash = meds.find((m) => other.test(m)) ?? names.find((n) => n !== inOrder && other.test(n));
    if (clash) warnings.push({ kind: "interaction", title: rule.title, detail: `With "${clash}". ${rule.detail}` });
  }

  if (patient.age < 12 && order.lines.some((l) => l.rx)) {
    warnings.push({ kind: "age", title: "Child patient", detail: `${patient.name} is ${patient.age}. Check the dose is right for the child's weight.` });
  }

  return warnings;
}
