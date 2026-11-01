import type { Metadata } from "next";
import { RoleGate } from "@/components/dashboard/role-gate";
import { AdminCatalog } from "@/components/dashboard/admin/catalog";

export const metadata: Metadata = { title: "Marketplace catalog" };

export default function Page() {
  return (
    <RoleGate allow={["admin"]}>
      <AdminCatalog />
    </RoleGate>
  );
}
