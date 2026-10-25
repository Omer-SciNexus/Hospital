import type { Metadata } from "next";
import { RoleGate } from "@/components/dashboard/role-gate";
import { AppointmentsScreen } from "@/components/dashboard/patient/appointments-screen";

export const metadata: Metadata = { title: "Appointments" };

export default function Page() {
  return (
    <RoleGate allow={["patient"]}>
      <AppointmentsScreen />
    </RoleGate>
  );
}
