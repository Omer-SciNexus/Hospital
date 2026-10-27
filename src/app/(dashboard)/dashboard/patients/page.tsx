import type { Metadata } from "next";
import { RoleGate } from "@/components/dashboard/role-gate";
import { PatientsScreen } from "@/components/dashboard/clinical/doctor/patients-screen";

export const metadata: Metadata = { title: "My patients" };

export default function Page() {
  return (
    <RoleGate allow={["doctor"]}>
      <PatientsScreen />
    </RoleGate>
  );
}
