import type { Metadata } from "next";
import { RoleGate } from "@/components/dashboard/role-gate";
import { AdminStaff } from "@/components/dashboard/admin/staff";

export const metadata: Metadata = { title: "Staff" };

export default function Page() {
  return (
    <RoleGate allow={["admin"]}>
      <AdminStaff />
    </RoleGate>
  );
}
