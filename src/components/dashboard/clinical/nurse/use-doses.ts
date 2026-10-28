"use client";

import { useEffect, useMemo, useState } from "react";
import { clinicalDetail, HOME_WARD, wardPatients, type Med, type RoundTime } from "@/data/clinical";
import type { Patient } from "@/data/patients";
import { useClinical, type DoseRecord } from "@/store/clinical";
import { dayKey } from "../shared";

export type DoseStatus = "due" | "given" | "held" | "missed";

export interface Dose {
  id: string;
  /** Store key, includes today's date. */
  key: string;
  patient: Patient;
  med: Med;
  round: RoundTime;
  due: Date;
  status: DoseStatus;
  overdue: boolean;
  record?: DoseRecord;
}

/** Current time, refreshed every 30 seconds so "overdue" stays honest. */
export function useNow(ms = 30_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

const seededHolds: Record<string, string> = {
  "margaret-shaw|Furosemide|06:00": "Systolic BP 98 before the dose. Dr. Haddad informed.",
};

function roundDate(time: string, base: Date) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * Today's medicine doses for a ward. Rounds that ended more than 2 hours ago
 * count as given by the earlier shift unless the store says otherwise.
 */
export function useDoses(ward = HOME_WARD) {
  const records = useClinical((s) => s.doses);
  const now = useNow();
  const minute = Math.floor(now.getTime() / 60_000);

  return useMemo(() => {
    const t = new Date(minute * 60_000);
    const day = dayKey(t);
    const doses: Dose[] = [];
    for (const patient of wardPatients(ward)) {
      for (const med of clinicalDetail(patient).meds) {
        for (const round of med.times) {
          const id = `${patient.id}|${med.name}|${round}`;
          const key = `${day}:${id}`;
          const due = roundDate(round, t);
          let record = records[key] as DoseRecord | undefined;
          if (!record && t.getTime() > due.getTime() + 2 * 3_600_000) {
            record = seededHolds[id]
              ? { status: "held", at: new Date(due.getTime() + 5 * 60_000).toISOString(), by: "Tom Baker", reason: seededHolds[id] }
              : { status: "given", at: new Date(due.getTime() + 12 * 60_000).toISOString(), by: round === "06:00" ? "Tom Baker" : "Grace Lee" };
          }
          const status: DoseStatus = record?.status ?? "due";
          doses.push({ id, key, patient, med, round, due, status, record, overdue: status === "due" && t.getTime() > due.getTime() + 30 * 60_000 });
        }
      }
    }
    return doses.sort((a, b) => a.due.getTime() - b.due.getTime() || Number(a.patient.bed) - Number(b.patient.bed));
  }, [records, ward, minute]);
}

