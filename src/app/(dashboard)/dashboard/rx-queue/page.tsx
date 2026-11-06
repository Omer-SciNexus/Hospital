import type { Metadata } from "next";
import { RoleGate } from "@/components/dashboard/role-gate";
import { RxQueue } from "@/components/dashboard/pharmacy/rx-queue";

export const metadata: Metadata = { title: "Rx to verify" };

export default function Page() {
  return (
    <RoleGate allow={["pharmacist"]}>
      <RxQueue />
    </RoleGate>
  );
}
