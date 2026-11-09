"use client";

import { usePathname } from "next/navigation";
import { Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/lib/use-hydrated";
import { useShop } from "@/store/shop";
import { useTriage } from "@/store/triage";
import { Button } from "@/components/ui/button";
import { TriagePanel } from "./triage-panel";

/**
 * Floating "Find my department" button and its chat panel, mounted once per layout.
 * Hidden on the emergency page, which tells people not to use online chat.
 */
export function TriageLauncher() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const setOpen = useTriage((s) => s.setOpen);
  const comparing = useShop((s) => s.compare.length > 0);

  if (pathname.startsWith("/emergency")) return null;

  // The compare tray sits at the bottom of shop pages, so move above it.
  const aboveTray = hydrated && comparing && pathname.startsWith("/marketplace");

  return (
    <>
      <Button
        size="lg"
        onClick={() => setOpen(true)}
        className={cn("fixed right-4 z-40 h-13 px-5 shadow-lift sm:right-6", aboveTray ? "bottom-24" : "bottom-4 sm:bottom-6")}
      >
        <Stethoscope aria-hidden /> Find my department
      </Button>
      <TriagePanel />
    </>
  );
}
