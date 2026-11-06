import type { Metadata } from "next";
import { RoleGate } from "@/components/dashboard/role-gate";
import { HandoverScreen } from "@/components/dashboard/clinical/nurse/handover-screen";

export const metadata: Metadata = { title: "Handover" };

export default function Page() {
  return (
    <RoleGate allow={["nurse"]}>
      <HandoverScreen />
    </RoleGate>
  );
}
