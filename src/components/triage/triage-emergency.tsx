"use client";

import Link from "next/link";
import { Ambulance, HeartHandshake, Phone, Siren } from "lucide-react";
import { site } from "@/config/site";
import { useTriage } from "@/store/triage";
import { Button } from "@/components/ui/button";

/** Replaces the chat. There is nothing to answer here, only people to call. */
export function TriageEmergency({ type }: { type: "emergency" | "crisis" }) {
  const undoLastMessage = useTriage((s) => s.undoLastMessage);
  const setOpen = useTriage((s) => s.setOpen);
  const crisis = type === "crisis";
  const Icon = crisis ? HeartHandshake : Siren;

  return (
    <div role="alert" className="flex flex-1 flex-col gap-4 overflow-y-auto bg-red-50 p-6 dark:bg-red-950/40">
      <Icon className="size-10 text-red-600 dark:text-red-400" aria-hidden />
      <h3 className="font-display text-2xl font-extrabold text-red-900 dark:text-red-100">
        {crisis ? "You are not alone" : "This may be an emergency"}
      </h3>
      <p className="text-red-900 dark:text-red-100">
        {crisis
          ? "What you are feeling matters, and you deserve support right now. Please talk to someone who can help. It is free and open all day and night."
          : "Please stop using this chat and get help now. Don't drive yourself if you feel faint."}
      </p>

      <div className="flex flex-col gap-3">
        {crisis ? (
          <>
            <Button asChild variant="danger" size="lg" autoFocus>
              <a href={`tel:${site.crisisLine}`}>
                <Phone aria-hidden /> Call {site.crisisLine} crisis line
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href={`tel:${site.emergencyShort}`}>In danger now? Call {site.emergencyShort}</a>
            </Button>
          </>
        ) : (
          <>
            <Button asChild variant="danger" size="lg" autoFocus>
              <a href={`tel:${site.emergencyShort}`}>
                <Phone aria-hidden /> Call {site.emergencyShort}
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href={`tel:${site.emergencyPhone}`}>
                <Ambulance aria-hidden /> Hospital ambulance
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/emergency" onClick={() => setOpen(false)}>
                Emergency information
              </Link>
            </Button>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={undoLastMessage}
        className="mt-auto self-center pt-2 text-sm font-medium text-red-900 underline underline-offset-4 dark:text-red-100"
      >
        I typed this by mistake
      </button>
    </div>
  );
}
