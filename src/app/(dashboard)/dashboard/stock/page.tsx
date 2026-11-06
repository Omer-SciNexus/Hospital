import type { Metadata } from "next";
import { RoleGate } from "@/components/dashboard/role-gate";
import { StockScreen } from "@/components/dashboard/pharmacy/stock";

export const metadata: Metadata = { title: "Medicine stock" };

export default function Page() {
  return (
    <RoleGate allow={["pharmacist"]}>
      <StockScreen />
    </RoleGate>
  );
}
