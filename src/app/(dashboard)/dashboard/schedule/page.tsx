import type { Metadata } from "next";
import { RoleGate } from "@/components/dashboard/role-gate";
import { ScheduleScreen } from "@/components/dashboard/clinical/doctor/schedule-screen";

export const metadata: Metadata = { title: "Schedule" };

export default function Page() {
  return (
    <RoleGate allow={["doctor"]}>
      <ScheduleScreen />
    </RoleGate>
  );
}
