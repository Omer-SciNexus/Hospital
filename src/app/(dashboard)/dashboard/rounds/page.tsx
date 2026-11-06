import type { Metadata } from "next";
import { RoleGate } from "@/components/dashboard/role-gate";
import { RoundsScreen } from "@/components/dashboard/clinical/nurse/rounds-screen";

export const metadata: Metadata = { title: "Medication rounds" };

export default function Page() {
  return (
    <RoleGate allow={["nurse"]}>
      <RoundsScreen />
    </RoleGate>
  );
}
