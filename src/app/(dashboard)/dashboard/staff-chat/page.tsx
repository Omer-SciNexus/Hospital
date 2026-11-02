import { Suspense } from "react";
import type { Metadata } from "next";
import { RoleGate } from "@/components/dashboard/role-gate";
import { StaffChat } from "@/components/chat/staff-chat";

export const metadata: Metadata = { title: "Staff chat" };

export default function StaffChatPage() {
  return (
    <RoleGate allow={["doctor", "nurse", "admin", "pharmacist", "billing"]}>
      <Suspense>
        <StaffChat />
      </Suspense>
    </RoleGate>
  );
}
