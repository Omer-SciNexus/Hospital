import type { Metadata } from "next";
import { RoleGate } from "@/components/dashboard/role-gate";
import { PatientChart } from "@/components/dashboard/clinical/chart/patient-chart";
import { getClinicalPatient } from "@/data/clinical";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: getClinicalPatient(id)?.name ?? "Patient chart" };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RoleGate allow={["doctor", "nurse"]}>
      <PatientChart id={id} />
    </RoleGate>
  );
}
