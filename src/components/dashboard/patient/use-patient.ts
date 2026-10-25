"use client";

import { useMemo } from "react";
import { roles } from "@/config/navigation";
import { DEMO_PATIENT_ID } from "@/data/patients";
import { useAppointments } from "@/store/appointments";
import { useInsurance } from "@/store/insurance";
import { useOrders } from "@/store/orders";
import { useSession } from "@/store/session";

/** Store slices filtered to the demo patient. Select raw arrays, derive with useMemo (zustand 5). */

export function useMyAppointments() {
  const all = useAppointments((s) => s.appointments);
  return useMemo(
    () => all.filter((a) => a.patientId === DEMO_PATIENT_ID).sort((a, b) => a.start.localeCompare(b.start)),
    [all],
  );
}

export function useMyOrders() {
  const all = useOrders((s) => s.orders);
  return useMemo(
    () => all.filter((o) => o.patientId === DEMO_PATIENT_ID).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [all],
  );
}

export function useMyInsurance() {
  const cards = useInsurance((s) => s.cards);
  const claims = useInsurance((s) => s.claims);
  const preapprovals = useInsurance((s) => s.preapprovals);
  return useMemo(() => {
    const myCards = cards.filter((c) => c.patientId === DEMO_PATIENT_ID);
    return {
      cards: myCards,
      primary: myCards.find((c) => c.primary) ?? myCards[0],
      claims: claims.filter((c) => c.patientId === DEMO_PATIENT_ID).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      preapprovals: preapprovals.filter((p) => p.patientId === DEMO_PATIENT_ID).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)),
    };
  }, [cards, claims, preapprovals]);
}

/** Name shown on screens: the signed-in profile name, else the role's demo persona. */
export function useDisplayName() {
  const role = useSession((s) => s.role) ?? "patient";
  const profileName = useSession((s) => s.profile?.name);
  return profileName || roles.find((r) => r.id === role)!.person;
}
