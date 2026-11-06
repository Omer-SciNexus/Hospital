import type { Metadata } from "next";
import { RoleGate } from "@/components/dashboard/role-gate";
import { WardScreen } from "@/components/dashboard/clinical/nurse/ward-screen";

export const metadata: Metadata = { title: "Ward board" };

export default function Page() {
  return (
    <RoleGate allow={["nurse"]}>
      <WardScreen />
    </RoleGate>
  );
}
