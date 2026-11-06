import type { Metadata } from "next";
import { RoleGate } from "@/components/dashboard/role-gate";
import { AdminInventory } from "@/components/dashboard/admin/inventory";

export const metadata: Metadata = { title: "Inventory" };

export default function Page() {
  return (
    <RoleGate allow={["admin"]}>
      <AdminInventory />
    </RoleGate>
  );
}
