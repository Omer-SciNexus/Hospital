import type { Metadata } from "next";
import { RoleGate } from "@/components/dashboard/role-gate";
import { RecordsScreen } from "@/components/dashboard/patient/records-screen";

export const metadata: Metadata = { title: "Results & records" };

export default function Page() {
  return (
    <RoleGate allow={["patient"]}>
      <RecordsScreen />
    </RoleGate>
  );
}
