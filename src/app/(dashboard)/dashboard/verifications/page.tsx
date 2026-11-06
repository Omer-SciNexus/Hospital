import type { Metadata } from "next";
import { RoleGate } from "@/components/dashboard/role-gate";
import { Verifications } from "@/components/dashboard/billing/verifications";

export const metadata: Metadata = { title: "Card checks" };

export default function Page() {
  return (
    <RoleGate allow={["billing"]}>
      <Verifications />
    </RoleGate>
  );
}
