"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Building2, CalendarClock, CalendarPlus, CalendarX, FileText, Video } from "lucide-react";
import { getDepartment } from "@/config/departments";
import { doctorsById } from "@/data/doctors";
import { useAppointments, type Appointment } from "@/store/appointments";
import { formatDay, formatTime } from "@/lib/dates";
import { cn, formatPrice } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { useMyAppointments } from "./use-patient";

const TIMES = ["09:00", "09:30", "10:30", "11:00", "13:30", "14:00", "15:30", "16:00", "17:30"];

type Dialogs = { kind: "reschedule" | "cancel" | "summary"; appointment: Appointment } | null;

/** Patient visits: upcoming / past / cancelled, with reschedule, cancel and visit summaries. */
export function AppointmentsScreen() {
  const appointments = useMyAppointments();
  const [dialog, setDialog] = useState<Dialogs>(null);

  const groups = useMemo(
    () => ({
      upcoming: appointments.filter((a) => a.status === "upcoming"),
      past: appointments.filter((a) => a.status === "completed").reverse(),
      cancelled: appointments.filter((a) => a.status === "cancelled").reverse(),
    }),
    [appointments],
  );

  const tabs = [
    { id: "upcoming", label: "Upcoming", items: groups.upcoming, empty: "No upcoming visits. Find a doctor and book a time that suits you." },
    { id: "past", label: "Past", items: groups.past, empty: "Your finished visits and doctor summaries will show here." },
    { id: "cancelled", label: "Cancelled", items: groups.cancelled, empty: "No cancelled visits." },
  ] as const;

  return (
    <div>
      <PageHeader
        eyebrow="My care"
        title="Appointments"
        description="See, move or cancel your visits. Video visits open 10 minutes before the start time."
        actions={
          <Button asChild>
            <Link href="/doctors">
              <CalendarPlus aria-hidden /> Book a new visit
            </Link>
          </Button>
        }
      />

      <Tabs defaultValue="upcoming">
        <TabsList aria-label="Appointment status">
          {tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.label}
              <span className="rounded-full bg-background px-1.5 text-xs tabular-nums">{t.items.length}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((t) => (
          <TabsContent key={t.id} value={t.id}>
            {t.items.length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface shadow-soft">
                <EmptyState
                  image="/images/dashboard/empty-appointments.png"
                  title={`No ${t.label.toLowerCase()} visits`}
                  description={t.empty}
                  action={
                    t.id === "upcoming" ? (
                      <Button asChild>
                        <Link href="/doctors">Find a doctor</Link>
                      </Button>
                    ) : undefined
                  }
                />
              </div>
            ) : (
              <ul className="grid gap-4">
                {t.items.map((a) => (
                  <AppointmentCard key={a.id} appointment={a} onOpen={(kind) => setDialog({ kind, appointment: a })} />
                ))}
              </ul>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <RescheduleDialog appointment={dialog?.kind === "reschedule" ? dialog.appointment : null} onClose={() => setDialog(null)} />
      <CancelDialog appointment={dialog?.kind === "cancel" ? dialog.appointment : null} onClose={() => setDialog(null)} />
      <SummaryDialog appointment={dialog?.kind === "summary" ? dialog.appointment : null} onClose={() => setDialog(null)} />
    </div>
  );
}

function AppointmentCard({ appointment: a, onOpen }: { appointment: Appointment; onOpen: (kind: "reschedule" | "cancel" | "summary") => void }) {
  const doctor = doctorsById[a.doctorId];
  const department = doctor ? getDepartment(doctor.department) : undefined;
  const isVideo = a.mode === "video";
  const startsIn = new Date(a.start).getTime() - Date.now();
  const soon = startsIn < 60 * 60_000 && startsIn > -60 * 60_000;

  return (
    <li className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row">
        <Avatar name={doctor?.name ?? "Doctor"} src={doctor?.photo} size={64} className="rounded-2xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold">{doctor?.name ?? "Doctor"}</h2>
            <StatusBadge status={a.status} />
            <Badge variant={isVideo ? "blue" : "muted"}>
              {isVideo ? <Video aria-hidden /> : <Building2 aria-hidden />} {isVideo ? "Video" : "In clinic"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {department?.name ?? doctor?.department} · Ref {a.id}
          </p>
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">When</dt>
              <dd className={cn("font-semibold", a.status === "cancelled" && "line-through opacity-70")}>
                {formatDay(a.start)}, {formatTime(a.start)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Reason</dt>
              <dd className="font-semibold">{a.reason}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">You pay</dt>
              <dd className="font-semibold">
                {formatPrice(a.youPay)}
                {a.youPay !== a.fee && <span className="ml-1 text-xs font-normal text-muted-foreground">of {formatPrice(a.fee)}</span>}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
        {a.status === "upcoming" && (
          <>
            {isVideo && (
              <Button
                size="sm"
                onClick={() =>
                  soon
                    ? toast.success("Joining your video room…", { description: `${doctor?.name ?? "Your doctor"} will let you in shortly.` })
                    : toast.info("The video room is not open yet", { description: "It opens 10 minutes before your visit." })
                }
              >
                <Video aria-hidden /> Join video
              </Button>
            )}
            <Button size="sm" variant="soft" onClick={() => onOpen("reschedule")}>
              <CalendarClock aria-hidden /> Reschedule
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.success("Added to your calendar", { description: `${formatDay(a.start)} at ${formatTime(a.start)}` })}
            >
              <CalendarPlus aria-hidden /> Add to calendar
            </Button>
            <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950" onClick={() => onOpen("cancel")}>
              <CalendarX aria-hidden /> Cancel
            </Button>
          </>
        )}
        {a.status === "completed" && (
          <>
            <Button size="sm" variant="soft" onClick={() => onOpen("summary")}>
              <FileText aria-hidden /> View summary
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/doctors/${a.doctorId}#book`}>
                <CalendarPlus aria-hidden /> Book again
              </Link>
            </Button>
          </>
        )}
        {a.status === "cancelled" && (
          <Button asChild size="sm" variant="soft">
            <Link href={`/doctors/${a.doctorId}#book`}>
              <CalendarPlus aria-hidden /> Book a new time
            </Link>
          </Button>
        )}
      </div>
    </li>
  );
}

function RescheduleDialog({ appointment, onClose }: { appointment: Appointment | null; onClose: () => void }) {
  return (
    <Dialog open={!!appointment} onOpenChange={(o) => !o && onClose()}>
      {appointment && <RescheduleForm key={appointment.id} appointment={appointment} onClose={onClose} />}
    </Dialog>
  );
}

function RescheduleForm({ appointment, onClose }: { appointment: Appointment; onClose: () => void }) {
  const reschedule = useAppointments((s) => s.reschedule);
  const [day, setDay] = useState(0);
  const [time, setTime] = useState<string | null>(null);
  const doctor = doctorsById[appointment.doctorId];

  const days = useMemo(() => {
    const start = new Date();
    return Array.from({ length: 10 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i + 1);
      return d;
    });
  }, []);

  function save() {
    if (!time) return;
    const d = new Date(days[day]);
    const [h, m] = time.split(":").map(Number);
    d.setHours(h, m, 0, 0);
    reschedule(appointment.id, d.toISOString());
    toast.success("Visit moved", { description: `${formatDay(d.toISOString())} at ${formatTime(d.toISOString())} with ${doctor?.name ?? "your doctor"}.` });
    onClose();
  }

  return (
    <DialogContent>
      <DialogTitle>Reschedule visit</DialogTitle>
      <DialogDescription>
        Now: {formatDay(appointment.start)} at {formatTime(appointment.start)} with {doctor?.name}. Pick a new day and time.
      </DialogDescription>
      <fieldset className="mt-5">
        <legend className="text-sm font-bold">Day</legend>
        <div className="scrollbar-none mt-2 flex gap-2 overflow-x-auto pb-1">
          {days.map((d, i) => (
            <button
              key={i}
              type="button"
              aria-pressed={day === i}
              onClick={() => {
                setDay(i);
                setTime(null);
              }}
              className={cn(
                "flex w-14 shrink-0 flex-col items-center rounded-xl border py-2 transition-colors",
                day === i ? "border-transparent bg-primary text-primary-foreground" : "border-border hover:border-brand-400",
              )}
            >
              <span className="text-[11px] font-semibold uppercase opacity-80">{d.toLocaleDateString("en-US", { weekday: "short" })}</span>
              <span className="font-display text-lg font-bold">{d.getDate()}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="mt-5">
        <legend className="text-sm font-bold">Time</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {TIMES.map((t, i) => {
            const free = (day * 5 + i * 3) % 4 !== 0;
            return (
              <button
                key={t}
                type="button"
                disabled={!free}
                aria-pressed={time === t}
                onClick={() => setTime(t)}
                className={cn(
                  "rounded-xl border py-2 text-sm font-semibold tabular-nums transition-colors disabled:cursor-not-allowed disabled:border-transparent disabled:bg-muted disabled:text-muted-foreground/60 disabled:line-through",
                  time === t ? "border-transparent bg-primary text-primary-foreground" : "border-border hover:border-brand-400",
                )}
              >
                {t}
              </button>
            );
          })}
        </div>
      </fieldset>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="ghost">Keep current time</Button>
        </DialogClose>
        <Button onClick={save} disabled={!time}>
          <CalendarClock aria-hidden /> Confirm new time
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function CancelDialog({ appointment, onClose }: { appointment: Appointment | null; onClose: () => void }) {
  const cancel = useAppointments((s) => s.cancel);
  const doctor = appointment ? doctorsById[appointment.doctorId] : undefined;
  return (
    <Dialog open={!!appointment} onOpenChange={(o) => !o && onClose()}>
      {appointment && (
        <DialogContent size="sm">
          <DialogTitle>Cancel this visit?</DialogTitle>
          <DialogDescription>
            {doctor?.name} on {formatDay(appointment.start)} at {formatTime(appointment.start)}. Free to cancel up to 24 hours before.
          </DialogDescription>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Keep visit</Button>
            </DialogClose>
            <Button
              variant="danger"
              onClick={() => {
                cancel(appointment.id);
                toast.success("Visit cancelled", { description: "We have let the clinic know." });
                onClose();
              }}
            >
              <CalendarX aria-hidden /> Yes, cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}

function SummaryDialog({ appointment, onClose }: { appointment: Appointment | null; onClose: () => void }) {
  const doctor = appointment ? doctorsById[appointment.doctorId] : undefined;
  return (
    <Dialog open={!!appointment} onOpenChange={(o) => !o && onClose()}>
      {appointment && (
        <DialogContent>
          <DialogTitle>Visit summary</DialogTitle>
          <DialogDescription>
            {appointment.reason} · {doctor?.name} · {formatDay(appointment.start)}
          </DialogDescription>
          <div className="mt-5 rounded-2xl bg-surface-2 p-4 text-sm leading-relaxed">
            {appointment.summary ?? "Your doctor has not added a summary for this visit."}
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Visit fee</dt>
              <dd className="font-semibold">{formatPrice(appointment.fee)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">You paid</dt>
              <dd className="font-semibold">{formatPrice(appointment.youPay)}</dd>
            </div>
          </dl>
          <DialogFooter>
            <Button variant="outline" onClick={() => toast.success("Summary downloaded", { description: `${appointment.id}-summary.pdf` })}>
              <FileText aria-hidden /> Download PDF
            </Button>
            <DialogClose asChild>
              <Button>Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
