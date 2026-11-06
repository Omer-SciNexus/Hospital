import type { Metadata } from "next";
import { RoleGate } from "@/components/dashboard/role-gate";
import { NotesScreen } from "@/components/dashboard/clinical/doctor/notes-screen";

export const metadata: Metadata = { title: "Visit notes" };

export default function Page() {
  return (
    <RoleGate allow={["doctor"]}>
      <NotesScreen />
    </RoleGate>
  );
}
