import { Suspense } from "react";
import type { Metadata } from "next";
import { RoleGate } from "@/components/dashboard/role-gate";
import { Community } from "@/components/chat/community";

export const metadata: Metadata = { title: "Community" };

export default function CommunityPage() {
  return (
    <RoleGate allow={["patient", "doctor", "nurse", "admin", "pharmacist", "billing"]}>
      <Suspense>
        <Community />
      </Suspense>
    </RoleGate>
  );
}
