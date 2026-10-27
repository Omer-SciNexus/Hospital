"use client";

import { useMemo } from "react";
import { DOCTOR_ID, templateForDay, type SlotType, type VisitStatus } from "@/data/clinical";
import { useAppointments } from "@/store/appointments";
import { useClinical } from "@/store/clinical";
import { dayKey } from "../shared";

export interface ScheduleItem {
  id: string;
  start: string;
  duration: number;
  type: SlotType;
  patientId?: string;
  reason: string;
  /** Only for clinic and video visits. */
  status?: VisitStatus;
  source: "template" | "booking" | "block";
}

export const slotStyles: Record<SlotType, { label: string; block: string; dot: string }> = {
  clinic: { label: "Clinic", block: "border-l-brand-600 bg-brand-50 text-brand-900 dark:bg-brand-950 dark:text-brand-100", dot: "bg-brand-600" },
  video: { label: "Video", block: "border-l-blue-600 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100", dot: "bg-blue-600" },
  procedure: { label: "Procedure", block: "border-l-violet-600 bg-violet-50 text-violet-900 dark:bg-violet-950 dark:text-violet-100", dot: "bg-violet-600" },
  ward: { label: "Ward round", block: "border-l-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100", dot: "bg-amber-500" },
  blocked: {
    label: "Blocked",
    block: "border-l-slate-500 bg-[repeating-linear-gradient(135deg,var(--muted)_0_6px,transparent_6px_12px)] text-muted-foreground",
    dot: "bg-slate-500",
  },
};

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const diff = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - diff);
  return x;
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function at(day: Date, time: string) {
  const [h, m] = time.split(":").map(Number);
  const x = new Date(day);
  x.setHours(h, m, 0, 0);
  return x;
}

function defaultStatus(start: Date, duration: number, now: Date, noShow?: boolean): VisitStatus {
  const end = start.getTime() + duration * 60_000;
  if (end < now.getTime()) return noShow ? "no-show" : "completed";
  if (start.getTime() - 20 * 60_000 <= now.getTime()) return "checked-in";
  return "upcoming";
}

/** Dr. Haddad's schedule for `days` days from `from`: demo templates + patient bookings + blocked time + status changes. */
export function useSchedule(from: Date, days: number) {
  const appointments = useAppointments((s) => s.appointments);
  const blocks = useClinical((s) => s.blocks);
  const overrides = useClinical((s) => s.visitStatus);
  const fromTime = from.getTime();

  return useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const start = new Date(fromTime);
    const end = addDays(start, days);
    const items: ScheduleItem[] = [];

    for (let i = 0; i < days; i++) {
      const day = addDays(start, i);
      const offset = Math.round((day.getTime() - today.getTime()) / 86_400_000);
      for (const t of templateForDay(offset, day.getDay())) {
        const s = at(day, t.time);
        const id = `S-${dayKey(day)}-${t.time.replace(":", "")}`;
        const visit = t.type === "clinic" || t.type === "video";
        items.push({
          id,
          start: s.toISOString(),
          duration: t.duration,
          type: t.type,
          patientId: t.patientId,
          reason: t.reason,
          status: visit ? overrides[id] ?? defaultStatus(s, t.duration, now, t.noShow) : undefined,
          source: "template",
        });
      }
    }

    for (const a of appointments) {
      if (a.doctorId !== DOCTOR_ID || a.status === "cancelled") continue;
      const s = new Date(a.start);
      if (s < start || s >= end) continue;
      items.push({
        id: a.id,
        start: a.start,
        duration: 30,
        type: a.mode,
        patientId: a.patientId,
        reason: a.reason,
        status: overrides[a.id] ?? (a.status === "completed" ? "completed" : defaultStatus(s, 30, now)),
        source: "booking",
      });
    }

    for (const b of blocks) {
      const s = new Date(b.start);
      if (s < start || s >= end) continue;
      items.push({ id: b.id, start: b.start, duration: b.duration, type: "blocked", reason: b.reason, source: "block" });
    }

    return items.sort((a, b) => a.start.localeCompare(b.start));
  }, [appointments, blocks, overrides, fromTime, days]);
}

export function isVisit(item: ScheduleItem) {
  return item.type === "clinic" || item.type === "video";
}
