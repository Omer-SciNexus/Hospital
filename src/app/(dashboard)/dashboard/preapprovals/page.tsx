import type { Metadata } from "next";
import { RoleGate } from "@/components/dashboard/role-gate";
import { PreapprovalsScreen } from "@/components/dashboard/billing/preapprovals";

export const metadata: Metadata = { title: "Pre-approvals" };

export default function Page() {
  return (
    <RoleGate allow={["billing"]}>
      <PreapprovalsScreen />
    </RoleGate>
  );
}
