import type { Metadata } from "next";
import { RoleGate } from "@/components/dashboard/role-gate";
import { InsuranceScreen } from "@/components/dashboard/patient/insurance-screen";

export const metadata: Metadata = { title: "Insurance" };

export default function Page() {
  return (
    <RoleGate allow={["patient"]}>
      <InsuranceScreen />
    </RoleGate>
  );
}
