import type { Metadata } from "next";
import { RoleGate } from "@/components/dashboard/role-gate";
import { AdminDepartments } from "@/components/dashboard/admin/departments";

export const metadata: Metadata = { title: "Departments" };

export default function Page() {
  return (
    <RoleGate allow={["admin"]}>
      <AdminDepartments />
    </RoleGate>
  );
}
