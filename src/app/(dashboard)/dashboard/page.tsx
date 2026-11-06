"use client";

import dynamic from "next/dynamic";
import type { Role } from "@/config/navigation";
import { useSession } from "@/store/session";
import DashboardLoading from "./loading";

// Each role's overview is its own chunk, so a patient never downloads the admin charts.
const overviews: Record<Role, React.ComponentType> = {
  patient: dynamic(() => import("@/components/dashboard/overviews/patient").then((m) => m.PatientOverview), { loading: () => <DashboardLoading /> }),
  doctor: dynamic(() => import("@/components/dashboard/overviews/doctor").then((m) => m.DoctorOverview), { loading: () => <DashboardLoading /> }),
  nurse: dynamic(() => import("@/components/dashboard/overviews/nurse").then((m) => m.NurseOverview), { loading: () => <DashboardLoading /> }),
  admin: dynamic(() => import("@/components/dashboard/overviews/admin").then((m) => m.AdminOverview), { loading: () => <DashboardLoading /> }),
  pharmacist: dynamic(() => import("@/components/dashboard/overviews/pharmacist").then((m) => m.PharmacistOverview), { loading: () => <DashboardLoading /> }),
  billing: dynamic(() => import("@/components/dashboard/overviews/billing").then((m) => m.BillingOverview), { loading: () => <DashboardLoading /> }),
};

/** Each role gets its own overview. The shell guarantees a role before this renders. */
export default function DashboardHome() {
  const role = useSession((s) => s.role) ?? "patient";
  const Overview = overviews[role];
  return <Overview />;
}
