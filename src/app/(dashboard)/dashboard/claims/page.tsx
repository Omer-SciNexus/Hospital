import type { Metadata } from "next";
import { RoleGate } from "@/components/dashboard/role-gate";
import { ClaimsScreen } from "@/components/dashboard/billing/claims";

export const metadata: Metadata = { title: "Claims" };

export default function Page() {
  return (
    <RoleGate allow={["billing"]}>
      <ClaimsScreen />
    </RoleGate>
  );
}
