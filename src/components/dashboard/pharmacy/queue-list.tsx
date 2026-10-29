"use client";

import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Keyboard-friendly work queue: a list of selectable items (Arrow Up/Down,
 * Home, End move the selection). Used by the Rx, card check and pre-approval
 * screens. `onSelect(id, picked)` gets `picked = true` for clicks so the page
 * can scroll the review panel into view on small screens.
 */
export function QueueList<T extends { id: string }>({
  items,
  selectedId,
  onSelect,
  label,
  renderItem,
  className,
}: {
  items: T[];
  selectedId?: string;
  onSelect: (id: string, picked: boolean) => void;
  label: string;
  renderItem: (item: T, selected: boolean) => React.ReactNode;
  className?: string;
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function onKeyDown(e: React.KeyboardEvent) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key) || items.length === 0) return;
    e.preventDefault();
    const idx = Math.max(0, items.findIndex((i) => i.id === selectedId));
    const next =
      e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : e.key === "ArrowDown" ? Math.min(items.length - 1, idx + 1) : Math.max(0, idx - 1);
    const id = items[next].id;
    onSelect(id, false);
    refs.current[id]?.focus();
  }

  return (
    <ul aria-label={label} onKeyDown={onKeyDown} className={cn("space-y-2", className)}>
      {items.map((item) => {
        const selected = item.id === selectedId;
        return (
          <li key={item.id}>
            <button
              type="button"
              ref={(el) => {
                refs.current[item.id] = el;
              }}
              aria-current={selected ? "true" : undefined}
              onClick={() => onSelect(item.id, true)}
              className={cn(
                "w-full rounded-2xl border bg-surface p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20",
                selected ? "border-brand-500 shadow-soft ring-1 ring-brand-500" : "border-border hover:border-brand-300",
              )}
            >
              {renderItem(item, selected)}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** The item after `id` in `list` (or the one before it when `id` is last). */
export function nextAfter<T extends { id: string }>(list: T[], id: string) {
  const idx = list.findIndex((i) => i.id === id);
  if (idx === -1) return list[0];
  return list[idx + 1] ?? list[idx - 1];
}

/** Ref + helper that scrolls the review panel into view on phones and tablets. */
export function useScrollToPanel<E extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<E>(null);
  const scroll = useCallback(() => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);
  return [ref, scroll] as const;
}

/** Reads `?name=` once on mount (dashboard screens render client-side only), for deep links like `?id=ORD-1`. */
export function queryParam(name: string) {
  if (typeof window === "undefined") return undefined;
  return new URLSearchParams(window.location.search).get(name) ?? undefined;
}
