import type { Metadata } from "next";
import { RoleGate } from "@/components/dashboard/role-gate";
import { LabQueue } from "@/components/dashboard/pharmacy/lab-queue";

export const metadata: Metadata = { title: "Lab queue" };

export default function Page() {
  return (
    <RoleGate allow={["pharmacist"]}>
      <LabQueue />
    </RoleGate>
  );
}
