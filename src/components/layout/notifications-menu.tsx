"use client";

import { useState } from "react";
import Link from "next/link";
import { Popover } from "radix-ui";
import { Bell, CheckCheck } from "lucide-react";
import { timeAgo } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Notice } from "./dashboard-signals";

const KEY = "aurelia-seen-notices";

function readSeen(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

const dot: Record<Notice["tone"], string> = {
  brand: "bg-brand-500",
  blue: "bg-blue-600",
  coral: "bg-coral-500",
  green: "bg-green-600",
  red: "bg-red-600",
};

/** Bell with a popover list. "Seen" ids are kept per browser so the dot clears after reading. */
export function NotificationsMenu({ notices }: { notices: Notice[] }) {
  // Only rendered inside the client-only dashboard shell, so reading storage on init is safe.
  const [seen, setSeen] = useState<string[]>(readSeen);

  const unread = notices.filter((n) => !seen.includes(n.id)).length;

  function markAll() {
    const next = Array.from(new Set([...seen, ...notices.map((n) => n.id)])).slice(-200);
    setSeen(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage blocked: keep in memory only */
    }
  }

  return (
    <Popover.Root>
      <Popover.Trigger
        className="relative grid size-10 place-items-center rounded-full hover:bg-muted"
        aria-label={unread ? `Notifications, ${unread} new` : "Notifications"}
      >
        <Bell className="size-[18px]" aria-hidden />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-coral-700 px-1 text-[10px] font-bold text-white ring-2 ring-surface tabular-nums">
            {unread}
          </span>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-[min(22rem,calc(100vw-2rem))] animate-[menu-in_150ms_ease-out] rounded-2xl border border-border bg-surface shadow-lift outline-none"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="font-display font-bold">Notifications</p>
            {unread > 0 && (
              <button type="button" onClick={markAll} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                <CheckCheck className="size-3.5" aria-hidden /> Mark all read
              </button>
            )}
          </div>
          {notices.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto p-1.5">
              {notices.map((n) => {
                const isNew = !seen.includes(n.id);
                return (
                  <li key={n.id}>
                    <Popover.Close asChild>
                      <Link href={n.href} className="flex gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted">
                        <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", isNew ? dot[n.tone] : "bg-transparent")} aria-hidden />
                        <span className="min-w-0 flex-1">
                          <span className={cn("block text-sm", isNew ? "font-bold" : "font-medium")}>{n.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">{n.text}</span>
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(n.at)}</span>
                      </Link>
                    </Popover.Close>
                  </li>
                );
              })}
            </ul>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
