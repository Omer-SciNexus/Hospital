import { Suspense } from "react";
import type { Metadata } from "next";
import { RoleGate } from "@/components/dashboard/role-gate";
import { CareChat } from "@/components/chat/care-chat";

export const metadata: Metadata = { title: "Care chat" };

export default function MessagesPage() {
  return (
    <RoleGate allow={["patient", "doctor", "nurse", "pharmacist", "billing"]}>
      <Suspense>
        <CareChat />
      </Suspense>
    </RoleGate>
  );
}
