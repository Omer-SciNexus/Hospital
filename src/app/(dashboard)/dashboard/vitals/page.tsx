import { Suspense } from "react";
import type { Metadata } from "next";
import { RoleGate } from "@/components/dashboard/role-gate";
import { VitalsScreen } from "@/components/dashboard/clinical/nurse/vitals-screen";

export const metadata: Metadata = { title: "Vitals" };

export default function Page() {
  return (
    <RoleGate allow={["nurse"]}>
      <Suspense>
        <VitalsScreen />
      </Suspense>
    </RoleGate>
  );
}
