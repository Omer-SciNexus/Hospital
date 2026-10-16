"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, CalendarCheck, Info, ShieldAlert, ShieldCheck, Video } from "lucide-react";
import { doctorsById } from "@/data/doctors";
import { insurers, insurersById } from "@/data/insurers";
import { DEMO_PATIENT_ID } from "@/data/patients";
import { useAppointments } from "@/store/appointments";
import { useInsurance } from "@/store/insurance";
import { useSession } from "@/store/session";
import { useHydrated } from "@/lib/use-hydrated";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/form-controls";

const TIMES = ["09:00", "09:30", "10:30", "11:00", "13:30", "14:00", "15:30", "16:00", "17:30"];

/** Deterministic fake availability so the same doctor always shows the same free slots. */
function isFree(doctorId: string, day: number, slot: number) {
  let h = day * 31 + slot * 7;
  for (const c of doctorId) h = (h * 33 + c.charCodeAt(0)) % 1009;
  return h % 3 !== 0;
}

export function BookingWidget({ doctorId }: { doctorId: string }) {
  const doctor = doctorsById[doctorId];
  const hydrated = useHydrated();
  const router = useRouter();
  const role = useSession((s) => s.role);
  const book = useAppointments((s) => s.book);
  const cards = useInsurance((s) => s.cards);
  const createClaim = useInsurance((s) => s.createClaim);

  const [mode, setMode] = useState<"clinic" | "video">("clinic");
  const [day, setDay] = useState(0);
  const [time, setTime] = useState<string | null>(null);
  const [insurer, setInsurer] = useState("");
  const [booked, setBooked] = useState<string | null>(null);
  const prefilled = useRef(false);

  // Signed-in patients start with their verified primary card selected.
  useEffect(() => {
    if (!hydrated || prefilled.current || role !== "patient") return;
    prefilled.current = true;
    const card = cards.find((c) => c.patientId === DEMO_PATIENT_ID && c.primary && c.status === "verified");
    if (card) setInsurer(card.insurerId);
  }, [hydrated, role, cards]);

  const { days, nowMinutes } = useMemo(() => {
    if (!hydrated) return { days: [], nowMinutes: 0 };
    const start = new Date();
    return {
      days: Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
      }),
      nowMinutes: start.getHours() * 60 + start.getMinutes(),
    };
  }, [hydrated]);

  /** Today's slots that already started can't be booked. */
  const isPast = (t: string, mins = nowMinutes) => {
    const [h, m] = t.split(":").map(Number);
    return day === 0 && h * 60 + m <= mins;
  };

  const signInHref = `/sign-in?next=${encodeURIComponent(`/doctors/${doctorId}#book`)}`;
  const staff = hydrated && !!role && role !== "patient";
  const plan = insurer ? insurersById[insurer] : null;
  const inNetwork = plan ? doctor.insurers.includes(plan.id) : false;
  // Coverage only counts once billing has verified the patient's card for this insurer.
  const hasCard = !!plan && role === "patient" && cards.some((c) => c.patientId === DEMO_PATIENT_ID && c.insurerId === plan.id && c.status === "verified");
  const fee = mode === "video" ? Math.round(doctor.fee * 0.75) : doctor.fee;
  const estimate = plan && inNetwork ? Math.round(fee * (1 - plan.coverage / 100)) : fee;
  const youPay = hasCard ? estimate : fee;

  function confirm() {
    if (!role) {
      router.push(signInHref);
      return;
    }
    if (role !== "patient" || !time || !days[day]) return;
    const now = new Date();
    if (isPast(time, now.getHours() * 60 + now.getMinutes())) {
      setTime(null);
      return;
    }
    const start = new Date(days[day]);
    const [h, m] = time.split(":").map(Number);
    start.setHours(h, m, 0, 0);
    const id = book({
      patientId: DEMO_PATIENT_ID,
      doctorId,
      start: start.toISOString(),
      mode,
      reason: "Booked online",
      fee,
      youPay,
      insurerId: hasCard ? plan?.id : undefined,
    });
    // Draft claim so billing can send it from the claims screen.
    if (plan && hasCard && inNetwork && fee > youPay) {
      createClaim({
        patientId: DEMO_PATIENT_ID,
        insurerId: plan.id,
        title: `${mode === "video" ? "Video" : "Clinic"} visit, ${doctor.name}`,
        source: "appointment",
        refId: id,
        amount: fee,
        insurerPays: fee - youPay,
      });
    }
    setBooked(id);
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-lift">
      <AnimatePresence mode="wait" initial={false}>
        {booked ? (
          <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 text-center sm:p-8">
            <Image src="/images/dashboard/success-order.png" alt="" width={160} height={160} className="mx-auto size-36" />
            <h2 className="mt-2 text-2xl font-extrabold">You&apos;re booked!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "video" ? "Video visit" : "Clinic visit"} with {doctor.name} on{" "}
              <span className="font-semibold text-foreground">
                {days[day]?.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} at {time}
              </span>
              .
            </p>
            <p className="mt-3 inline-block rounded-full bg-muted px-3 py-1 font-mono text-xs">Ref {booked}</p>
            <div className="mt-6 flex flex-col gap-2">
              <Button asChild>
                <Link href="/dashboard/appointments">View in my dashboard</Link>
              </Button>
              <Button variant="ghost" onClick={() => setBooked(null)}>
                Book another time
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-gradient-to-br from-brand-700 to-blue-700 p-6 text-white">
              <p className="text-sm text-brand-100">Book with</p>
              <h2 className="text-xl font-bold">{doctor.name}</h2>
              <p className="mt-1 text-sm text-brand-100">Next available: {doctor.nextAvailable}</p>
            </div>

            <div className="space-y-6 p-6">
              <fieldset>
                <legend className="text-sm font-bold">Visit type</legend>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {([
                    { id: "clinic", label: "In clinic", icon: Building2, disabled: false },
                    { id: "video", label: "Video", icon: Video, disabled: !doctor.telehealth },
                  ] as const).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      disabled={m.disabled}
                      aria-pressed={mode === m.id}
                      onClick={() => setMode(m.id)}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                        mode === m.id ? "border-brand-500 bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200" : "border-border hover:border-brand-400",
                      )}
                    >
                      <m.icon className="size-4" aria-hidden /> {m.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-bold">Day</legend>
                <div className="scrollbar-none mt-2 flex gap-2 overflow-x-auto pb-1">
                  {hydrated
                    ? days.map((d, i) => (
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
                          <span className="text-[11px] font-semibold uppercase opacity-80">
                            {i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" })}
                          </span>
                          <span className="font-display text-lg font-bold">{d.getDate()}</span>
                        </button>
                      ))
                    : Array.from({ length: 6 }).map((_, i) => <span key={i} className="h-16 w-14 shrink-0 animate-pulse rounded-xl bg-muted" />)}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-bold">Time</legend>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {TIMES.map((t, i) => {
                    const free = isFree(doctorId, day, i) && !isPast(t);
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

              <div>
                <label htmlFor="booking-insurer" className="text-sm font-bold">Insurance</label>
                <NativeSelect id="booking-insurer" className="mt-2" value={insurer} onChange={(e) => setInsurer(e.target.value)}>
                  <option value="">I&apos;ll pay myself</option>
                  {insurers.map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </NativeSelect>
                {plan && (
                  <p
                    className={cn(
                      "mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium",
                      inNetwork ? "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200" : "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
                    )}
                  >
                    {inNetwork ? <ShieldCheck className="size-4 shrink-0" aria-hidden /> : <ShieldAlert className="size-4 shrink-0" aria-hidden />}
                    {inNetwork ? `In network: insurance pays ${plan.coverage}%` : "Out of network for this doctor"}
                  </p>
                )}
                {plan && !hasCard && (
                  <p className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                    <Info className="mt-px size-3.5 shrink-0" aria-hidden />
                    <span>
                      Estimate — add and verify your card in{" "}
                      <Link href="/dashboard/insurance" className="font-semibold text-primary hover:underline">
                        Insurance
                      </Link>{" "}
                      to use it. Until then you pay the full fee.
                    </span>
                  </p>
                )}
              </div>

              <div className="flex items-end justify-between border-t border-border pt-5">
                <div>
                  <p className="text-xs text-muted-foreground">{plan && !hasCard && estimate !== fee ? "Estimated, with your card" : "You pay"}</p>
                  <p className="font-display text-2xl font-extrabold">
                    {formatPrice(estimate)}
                    {estimate !== fee && <s className="ml-2 text-sm font-medium text-muted-foreground">{formatPrice(fee)}</s>}
                  </p>
                </div>
                <Button disabled={!time || staff} onClick={confirm} size="lg">
                  <CalendarCheck aria-hidden /> {hydrated && !role ? "Sign in & book" : "Confirm"}
                </Button>
              </div>
              {staff && (
                <p className="rounded-xl bg-muted px-3 py-2 text-sm">
                  Booking is for patients.{" "}
                  <Link href={signInHref} className="font-semibold text-primary hover:underline">
                    Switch to the patient demo to book.
                  </Link>
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
