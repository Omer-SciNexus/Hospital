import type { Metadata } from "next";
import { RoleGate } from "@/components/dashboard/role-gate";
import { PrescriptionsScreen } from "@/components/dashboard/patient/prescriptions-screen";

export const metadata: Metadata = { title: "Prescriptions" };

export default function Page() {
  return (
    <RoleGate allow={["patient"]}>
      <PrescriptionsScreen />
    </RoleGate>
  );
}
