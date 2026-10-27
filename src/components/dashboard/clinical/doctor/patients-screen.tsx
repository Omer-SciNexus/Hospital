"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { doctorPatients, labResults, type ResultFlag } from "@/data/clinical";
import type { Patient, PatientStatus } from "@/data/patients";
import { insurersById } from "@/data/insurers";
import { useAppointments } from "@/store/appointments";
import { useClinical } from "@/store/clinical";
import { formatDay } from "@/lib/dates";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable, type ColumnDef } from "@/components/dashboard/data-table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { FilterChip, NewsBadge, PatientIdentity, useNewsOf } from "../shared";

type Row = Patient & { newsNow: number; lastVisit?: string; insurer: string; location: string };

const statusFilters: { id: "all" | PatientStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "critical", label: "Critical" },
  { id: "observation", label: "Observation" },
  { id: "stable", label: "Stable" },
  { id: "outpatient", label: "Outpatient" },
];

const abnormalFlags: ResultFlag[] = ["critical", "high", "low", "abnormal"];
const abnormal = (id: string) => labResults.filter((r) => r.patientId === id && abnormalFlags.includes(r.flag)).length;

/** Dr. Haddad's patient list with status filter chips. Rows open the patient chart. */
export function PatientsScreen() {
  const router = useRouter();
  const newsOf = useNewsOf();
  const notes = useClinical((s) => s.notes);
  const appointments = useAppointments((s) => s.appointments);
  const [status, setStatus] = useState<(typeof statusFilters)[number]["id"]>("all");

  const rows = useMemo<Row[]>(() => {
    return doctorPatients.map((p) => {
      const dates = [
        ...notes.filter((n) => n.patientId === p.id).map((n) => n.createdAt),
        ...appointments.filter((a) => a.patientId === p.id && a.status === "completed").map((a) => a.start),
      ].sort();
      return {
        ...p,
        newsNow: newsOf(p),
        lastVisit: dates.at(-1),
        insurer: p.insurerId ? insurersById[p.insurerId]?.name ?? "—" : "Self-pay",
        location: p.ward ? `${p.ward} · bed ${p.bed}` : "Clinic",
      };
    });
  }, [newsOf, notes, appointments]);

  const filtered = status === "all" ? rows : rows.filter((r) => r.status === status);

  const columns = useMemo<ColumnDef<Row, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Patient",
        cell: ({ row }) => <PatientIdentity patient={row.original} size={34} sub={`${row.original.mrn}`} />,
      },
      { accessorKey: "mrn", header: "MRN", meta: { className: "hidden" } },
      {
        id: "agesex",
        header: "Age / sex",
        accessorFn: (r) => r.age,
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.age} {row.original.sex}
          </span>
        ),
        meta: { className: "hidden sm:table-cell" },
      },
      {
        accessorKey: "condition",
        header: "Condition",
        cell: ({ row }) => (
          <span className="block max-w-56">
            <span className="line-clamp-2">{row.original.condition}</span>
            {abnormal(row.original.id) > 0 && (
              <span className="text-xs text-coral-700 dark:text-orange-300">{abnormal(row.original.id)} abnormal result(s)</span>
            )}
          </span>
        ),
        meta: { className: "hidden md:table-cell" },
      },
      { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      { accessorKey: "location", header: "Ward / bed", meta: { className: "hidden lg:table-cell whitespace-nowrap" } },
      {
        accessorKey: "newsNow",
        header: "NEWS",
        cell: ({ row }) => (row.original.ward ? <NewsBadge score={row.original.newsNow} /> : <span className="text-xs text-muted-foreground">n/a</span>),
      },
      { accessorKey: "insurer", header: "Insurer", meta: { className: "hidden xl:table-cell whitespace-nowrap" } },
      {
        accessorKey: "lastVisit",
        header: "Last visit",
        cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{row.original.lastVisit ? formatDay(row.original.lastVisit) : row.original.admittedAt ?? "—"}</span>,
        meta: { className: "hidden xl:table-cell" },
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        eyebrow="Dr. Layla Haddad · Cardiology"
        title="My patients"
        description={`${rows.filter((r) => r.ward).length} on the ward and ${rows.filter((r) => !r.ward).length} in clinic. Click a row to open the chart.`}
      />
      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Search name, MRN or condition"
        onRowClick={(r) => router.push(`/dashboard/patients/${r.id}`)}
        initialSorting={[{ id: "newsNow", desc: true }]}
        toolbar={statusFilters.map((f) => (
          <FilterChip key={f.id} active={status === f.id} onClick={() => setStatus(f.id)} count={f.id === "all" ? rows.length : rows.filter((r) => r.status === f.id).length}>
            {f.label}
          </FilterChip>
        ))}
        empty={{ title: "No patients", description: "No patients match this filter." }}
      />
    </div>
  );
}
