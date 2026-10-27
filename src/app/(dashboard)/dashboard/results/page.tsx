import { Suspense } from "react";
import type { Metadata } from "next";
import { RoleGate } from "@/components/dashboard/role-gate";
import { ResultsScreen } from "@/components/dashboard/clinical/doctor/results-screen";

export const metadata: Metadata = { title: "Lab results" };

export default function Page() {
  return (
    <RoleGate allow={["doctor"]}>
      <Suspense>
        <ResultsScreen />
      </Suspense>
    </RoleGate>
  );
}
