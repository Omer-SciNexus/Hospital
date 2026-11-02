"use client";

import { useMemo } from "react";
import type { Role } from "@/config/navigation";
import { DEMO_PATIENT_ID } from "@/data/patients";
import { personaIds } from "@/data/staff";
import { careUnreadByThread, staffUnreadByChannel, sumCounts, useChat } from "@/store/chat";

/** Total unread messages for a nav badge: "staff" = staff chat, "care" = care chat / patient messages. */
export function useChatUnread(role: Role, space: "staff" | "care") {
  const channels = useChat((s) => s.channels);
  const staffMessages = useChat((s) => s.staffMessages);
  const careThreads = useChat((s) => s.careThreads);
  const careMessages = useChat((s) => s.careMessages);
  const lastRead = useChat((s) => s.lastRead);
  const meId = role === "patient" ? DEMO_PATIENT_ID : personaIds[role];

  return useMemo(() => {
    if (space === "staff") return role === "patient" ? 0 : sumCounts(staffUnreadByChannel({ channels, staffMessages, lastRead }, meId));
    return sumCounts(careUnreadByThread({ careThreads, careMessages, lastRead }, role, meId));
  }, [space, role, meId, channels, staffMessages, careThreads, careMessages, lastRead]);
}
