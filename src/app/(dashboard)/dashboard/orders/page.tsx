import type { Metadata } from "next";
import { RoleGate } from "@/components/dashboard/role-gate";
import { OrdersScreen } from "@/components/dashboard/patient/orders-screen";

export const metadata: Metadata = { title: "My orders" };

export default function Page() {
  return (
    <RoleGate allow={["patient"]}>
      <OrdersScreen />
    </RoleGate>
  );
}
