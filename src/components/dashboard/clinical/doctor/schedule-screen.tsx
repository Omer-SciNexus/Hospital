"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Ban, CalendarX, ChevronLeft, ChevronRight, FileHeart, Stethoscope, Trash2, UserCheck, UserX, Video } from "lucide-react";
import { clinicalPatientsById } from "@/data/clinical";
import { insurersById } from "@/data/insurers";
import { useClinical } from "@/store/clinical";
import { formatTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Label, NativeSelect, Input } from "@/components/ui/form-controls";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { AllergyBadges, NewsBadge, PatientIdentity, dayKey, useNewsOf } from "../shared";
import { NoteEditorDialog } from "../note-editor";
import { addDays, isVisit, slotStyles, startOfDay, startOfWeek, useSchedule, type ScheduleItem } from "./use-schedule";

const START_HOUR = 8;
const END_HOUR = 18;
const HOUR_H = 64;
const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

const fmtDay = (d: Date, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", opts).format(d);

/** Doctor schedule with day and week views, appointment actions and blocked time. */
export function ScheduleScreen() {
  const [view, setView] = useState<"day" | "week">(() => (typeof window !== "undefined" && window.innerWidth < 768 ? "day" : "week"));
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [selected, setSelected] = useState<ScheduleItem | null>(null);
  const [blockOpen, setBlockOpen] = useState(false);

  const weekStart = useMemo(() => startOfWeek(anchor), [anchor]);
  const from = view === "week" ? weekStart : anchor;
  const items = useSchedule(from, view === "week" ? 7 : 1);
  const visits = items.filter(isVisit);

  const step = (dir: number) => setAnchor((a) => addDays(a, dir * (view === "week" ? 7 : 1)));
  const rangeLabel =
    view === "week"
      ? `${fmtDay(weekStart, { month: "short", day: "numeric" })} – ${fmtDay(addDays(weekStart, 6), { month: "short", day: "numeric", year: "numeric" })}`
      : fmtDay(anchor, { weekday: "long", month: "long", day: "numeric" });

  return (
    <div>
      <PageHeader
        eyebrow="Dr. Layla Haddad · Cardiology"
        title="Schedule"
        description={`${visits.length} visits ${view === "week" ? "this week" : "on this day"}. Click a block to check a patient in or open their chart.`}
        actions={
          <Button onClick={() => setBlockOpen(true)} variant="outline">
            <Ban aria-hidden /> Block out time
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex items-center gap-2">
          <div role="group" aria-label="View" className="inline-flex rounded-full bg-muted p-1">
            {(["day", "week"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-semibold capitalize text-muted-foreground transition-all",
                  view === v && "bg-surface text-foreground shadow-soft",
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <Button variant="outline" size="icon" onClick={() => step(-1)} aria-label={`Previous ${view}`}>
            <ChevronLeft aria-hidden />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAnchor(startOfDay(new Date()))}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => step(1)} aria-label={`Next ${view}`}>
            <ChevronRight aria-hidden />
          </Button>
        </div>
        <p className="font-display text-lg font-bold" aria-live="polite">
          {rangeLabel}
        </p>
        <ul className="flex flex-wrap gap-3 text-xs text-muted-foreground lg:ml-auto">
          {Object.entries(slotStyles).map(([k, s]) => (
            <li key={k} className="flex items-center gap-1.5">
              <span className={cn("size-2.5 rounded-sm", s.dot)} aria-hidden />
              {s.label}
            </li>
          ))}
        </ul>
      </div>

      {view === "week" ? (
        <WeekGrid weekStart={weekStart} items={items} onSelect={setSelected} 
          onPickDay={(d) => {
            setAnchor(d);
            setView("day");
          }}
        />
      ) : (
        <DayList day={anchor} items={items} onSelect={setSelected} />
      )}

      <AppointmentDialog item={selected} onClose={() => setSelected(null)} />
      <BlockDialog open={blockOpen} onOpenChange={setBlockOpen} defaultDay={anchor} />
    </div>
  );
}

function WeekGrid({
  weekStart,
  items,
  onSelect,
  onPickDay,
}: {
  weekStart: Date;
  items: ScheduleItem[];
  onSelect: (i: ScheduleItem) => void;
  onPickDay: (d: Date) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  const nowTop = ((now.getHours() + now.getMinutes() / 60 - START_HOUR) * HOUR_H);

  return (
    <div className="relative overflow-x-auto rounded-2xl border border-border bg-surface shadow-soft">
      <div className="min-w-205">
        <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-border">
          <div />
          {days.map((d) => {
            const today = d.toDateString() === now.toDateString();
            const count = items.filter((i) => isVisit(i) && new Date(i.start).toDateString() === d.toDateString()).length;
            return (
              <button
                key={d.toISOString()}
                type="button"
                onClick={() => onPickDay(d)}
                className="flex flex-col items-center gap-0.5 border-l border-border px-2 py-2.5 text-center hover:bg-muted/50"
                aria-label={`Open ${fmtDay(d, { weekday: "long", month: "long", day: "numeric" })}, ${count} visits`}
              >
                <span className="text-xs font-semibold uppercase text-muted-foreground">{fmtDay(d, { weekday: "short" })}</span>
                <span className={cn("grid size-8 place-items-center rounded-full font-display text-sm font-bold", today && "bg-primary text-primary-foreground")}>
                  {d.getDate()}
                </span>
                <span className="text-[11px] text-muted-foreground">{count} visits</span>
              </button>
            );
          })}
        </div>
        <div className="relative grid grid-cols-[56px_repeat(7,1fr)]">
          <div>
            {hours.map((h) => (
              <div key={h} style={{ height: HOUR_H }} className="-translate-y-2 pr-2 text-right text-[11px] tabular-nums text-muted-foreground">
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>
          {days.map((d) => {
            const dayItems = items.filter((i) => new Date(i.start).toDateString() === d.toDateString());
            const today = d.toDateString() === now.toDateString();
            return (
              <div key={d.toISOString()} className={cn("relative border-l border-border", today && "bg-brand-50/40 dark:bg-brand-950/20")}>
                {hours.map((h) => (
                  <div key={h} style={{ height: HOUR_H }} className="border-b border-dashed border-border/70" />
                ))}
                {dayItems.map((it) => {
                  const s = new Date(it.start);
                  const startH = s.getHours() + s.getMinutes() / 60;
                  const top = Math.max(0, (startH - START_HOUR) * HOUR_H);
                  const bottom = Math.min((END_HOUR - START_HOUR) * HOUR_H, (startH + it.duration / 60 - START_HOUR) * HOUR_H);
                  if (bottom <= 0) return null;
                  const p = it.patientId ? clinicalPatientsById[it.patientId] : undefined;
                  const muted = it.status === "completed" || it.status === "no-show";
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => onSelect(it)}
                      style={{ top: top + 1, height: Math.max(22, bottom - top - 2) }}
                      className={cn(
                        "absolute inset-x-1 overflow-hidden rounded-lg border-l-4 px-1.5 py-1 text-left text-[11px] leading-tight shadow-xs transition-shadow hover:shadow-soft focus-visible:outline-2 focus-visible:outline-brand-500",
                        slotStyles[it.type].block,
                        muted && "opacity-60",
                        it.status === "no-show" && "line-through",
                      )}
                      aria-label={`${formatTime(it.start)}, ${slotStyles[it.type].label}, ${p?.name ?? it.reason}${it.status ? `, ${it.status}` : ""}`}
                    >
                      <span className="block font-bold tabular-nums">{formatTime(it.start)}</span>
                      <span className="block truncate font-semibold">{p?.name ?? it.reason}</span>
                      {it.duration >= 60 && p && <span className="block truncate opacity-80">{it.reason}</span>}
                    </button>
                  );
                })}
                {today && nowTop > 0 && nowTop < (END_HOUR - START_HOUR) * HOUR_H && (
                  <div className="pointer-events-none absolute inset-x-0 z-10 flex items-center" style={{ top: nowTop }} aria-hidden>
                    <span className="-ml-1 size-2 rounded-full bg-red-600" />
                    <span className="h-px flex-1 bg-red-600" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DayList({ day, items, onSelect }: { day: Date; items: ScheduleItem[]; onSelect: (i: ScheduleItem) => void }) {
  const newsOf = useNewsOf();
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-border bg-surface shadow-soft">
        <EmptyState image="/images/dashboard/empty-appointments.png" title="Nothing booked" description={`No visits on ${fmtDay(day, { weekday: "long" })}.`} />
      </div>
    );
  }
  return (
    <ol className="space-y-2">
      {items.map((it) => {
        const p = it.patientId ? clinicalPatientsById[it.patientId] : undefined;
        const end = new Date(new Date(it.start).getTime() + it.duration * 60_000).toISOString();
        return (
          <li key={it.id}>
            <button
              type="button"
              onClick={() => onSelect(it)}
              className={cn(
                "flex w-full flex-wrap items-center gap-3 rounded-2xl border border-l-4 border-border bg-surface p-4 text-left shadow-soft transition-colors hover:border-brand-400 sm:flex-nowrap",
                slotStyles[it.type].block.split(" ").filter((c) => c.startsWith("border-l-")),
              )}
            >
              <span className="w-20 shrink-0 text-sm font-bold tabular-nums">
                {formatTime(it.start)}
                <span className="block text-xs font-normal text-muted-foreground">to {formatTime(end)}</span>
              </span>
              <span className="min-w-0 flex-1">
                {p ? <PatientIdentity patient={p} size={36} sub={`${it.reason} · ${p.condition}`} /> : <span className="font-semibold">{it.reason}</span>}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className={cn("size-2 rounded-full", slotStyles[it.type].dot)} aria-hidden />
                {slotStyles[it.type].label}
              </span>
              {p && p.news > 0 && <NewsBadge score={newsOf(p)} />}
              {it.status && <StatusBadge status={it.status} />}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function AppointmentDialog({ item, onClose }: { item: ScheduleItem | null; onClose: () => void }) {
  const setVisitStatus = useClinical((s) => s.setVisitStatus);
  const removeBlock = useClinical((s) => s.removeBlock);
  const newsOf = useNewsOf();
  const [noteFor, setNoteFor] = useState<ScheduleItem | null>(null);
  const p = item?.patientId ? clinicalPatientsById[item.patientId] : undefined;
  const insurer = p?.insurerId ? insurersById[p.insurerId] : undefined;

  function setStatus(status: "checked-in" | "no-show") {
    if (!item) return;
    setVisitStatus(item.id, status);
    toast.success(status === "checked-in" ? `${p?.name ?? "Patient"} checked in` : "Marked as no-show", {
      description: status === "no-show" ? "The front desk will call to rebook." : undefined,
    });
    onClose();
  }

  return (
    <>
      <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
        <DialogContent size="md">
          {item && (
            <>
              <DialogTitle>{p ? p.name : slotStyles[item.type].label}</DialogTitle>
              <DialogDescription>
                {fmtDay(new Date(item.start), { weekday: "long", month: "short", day: "numeric" })}, {formatTime(item.start)} · {item.duration} min ·{" "}
                {slotStyles[item.type].label}
              </DialogDescription>

              <div className="mt-5 space-y-4">
                {p && (
                  <div className="rounded-2xl bg-surface-2 p-4">
                    <PatientIdentity patient={p} size={48} sub={`${p.mrn} · ${p.age} ${p.sex === "F" ? "female" : "male"} · ${p.bloodType}`} />
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-xs text-muted-foreground">Reason</dt>
                        <dd className="font-medium">{item.reason}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Condition</dt>
                        <dd className="font-medium">{p.condition}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Insurance</dt>
                        <dd className="font-medium">{insurer?.name ?? "Self-pay"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Early warning</dt>
                        <dd>
                          <NewsBadge score={newsOf(p)} />
                        </dd>
                      </div>
                    </dl>
                    <div className="mt-3">
                      <AllergyBadges allergies={p.allergies} />
                    </div>
                  </div>
                )}
                {!p && <p className="text-sm text-muted-foreground">{item.reason}</p>}
                {item.status && (
                  <p className="flex items-center gap-2 text-sm">
                    Status: <StatusBadge status={item.status} />
                  </p>
                )}
              </div>

              <DialogFooter className="flex-wrap">
                {item.type === "blocked" && (
                  <Button
                    variant="danger"
                    onClick={() => {
                      removeBlock(item.id);
                      toast.success("Blocked time removed");
                      onClose();
                    }}
                  >
                    <Trash2 aria-hidden /> Remove block
                  </Button>
                )}
                {isVisit(item) && item.status === "upcoming" && (
                  <Button variant="soft" onClick={() => setStatus("checked-in")}>
                    <UserCheck aria-hidden /> Check in
                  </Button>
                )}
                {isVisit(item) && (item.status === "upcoming" || item.status === "checked-in") && (
                  <Button variant="outline" onClick={() => setStatus("no-show")}>
                    <UserX aria-hidden /> Mark no-show
                  </Button>
                )}
                {item.type === "video" && item.status !== "completed" && item.status !== "no-show" && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      toast.success("Video room opened", { description: `${p?.name} gets a link by text message.` });
                    }}
                  >
                    <Video aria-hidden /> Start video
                  </Button>
                )}
                {isVisit(item) && item.status !== "completed" && item.status !== "no-show" && p && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNoteFor(item);
                      onClose();
                    }}
                  >
                    <Stethoscope aria-hidden /> Start visit note
                  </Button>
                )}
                {p && (
                  <Button asChild>
                    <Link href={`/dashboard/patients/${p.id}`}>
                      <FileHeart aria-hidden /> Open chart
                    </Link>
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      <NoteEditorDialog
        open={!!noteFor}
        onOpenChange={(o) => !o && setNoteFor(null)}
        patientId={noteFor?.patientId}
        type={noteFor?.type === "video" ? "Video visit" : "Clinic visit"}
        onSigned={() => noteFor && setVisitStatus(noteFor.id, "completed")}
      />
    </>
  );
}

const blockTimes = Array.from({ length: 20 }, (_, i) => `${String(8 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);
const blockReasons = ["Admin time", "Teaching", "Department meeting", "Lunch", "Personal", "Research"];

function BlockDialog({ open, onOpenChange, defaultDay }: { open: boolean; onOpenChange: (o: boolean) => void; defaultDay: Date }) {
  const addBlock = useClinical((s) => s.addBlock);
  const [date, setDate] = useState(dayKey(defaultDay));
  const [time, setTime] = useState("12:00");
  const [duration, setDuration] = useState(60);
  const [reason, setReason] = useState(blockReasons[0]);

  useEffect(() => {
    if (open) setDate(dayKey(defaultDay));
  }, [open, defaultDay]);

  function save(e: React.FormEvent) {
    e.preventDefault();
    const [y, mo, d] = date.split("-").map(Number);
    const [h, mi] = time.split(":").map(Number);
    if (!y) return toast.error("Pick a date");
    const start = new Date(y, mo - 1, d, h, mi);
    addBlock({ start: start.toISOString(), duration, reason });
    toast.success("Time blocked", { description: `${reason}, ${fmtDay(start, { weekday: "short", month: "short", day: "numeric" })} at ${time}` });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <form onSubmit={save}>
          <DialogTitle className="flex items-center gap-2">
            <CalendarX className="size-5 text-primary" aria-hidden /> Block out time
          </DialogTitle>
          <DialogDescription>Patients cannot book into blocked time.</DialogDescription>
          <div className="mt-5 grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="block-date">Date</Label>
              <Input id="block-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="block-time">Start</Label>
                <NativeSelect id="block-time" value={time} onChange={(e) => setTime(e.target.value)}>
                  {blockTimes.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="block-duration">Length</Label>
                <NativeSelect id="block-duration" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                  {[30, 60, 90, 120, 240].map((m) => (
                    <option key={m} value={m}>
                      {m < 60 ? `${m} min` : `${m / 60} h`}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="block-reason">Reason</Label>
              <NativeSelect id="block-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
                {blockReasons.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </NativeSelect>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Ban aria-hidden /> Block time
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
