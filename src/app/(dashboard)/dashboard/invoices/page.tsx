import type { Metadata } from "next";
import { RoleGate } from "@/components/dashboard/role-gate";
import { InvoicesScreen } from "@/components/dashboard/billing/invoices";

export const metadata: Metadata = { title: "Invoices" };

export default function Page() {
  return (
    <RoleGate allow={["billing"]}>
      <InvoicesScreen />
    </RoleGate>
  );
}
