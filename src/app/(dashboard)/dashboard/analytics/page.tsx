import type { Metadata } from "next";
import { RoleGate } from "@/components/dashboard/role-gate";
import { AdminAnalytics } from "@/components/dashboard/admin/analytics";

export const metadata: Metadata = { title: "Analytics" };

export default function Page() {
  return (
    <RoleGate allow={["admin"]}>
      <AdminAnalytics />
    </RoleGate>
  );
}
