"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CalendarPlus,
  FlaskConical,
  MapPin,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
  Upload,
  Video,
} from "lucide-react";
import { getDepartment } from "@/config/departments";
import { doctorsById } from "@/data/doctors";
import { insurersById } from "@/data/insurers";
import { formatDay, formatTime } from "@/lib/dates";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { InsurerLogo } from "@/components/marketing/insurer-logo";
import { BloodPressureChart } from "@/components/dashboard/patient/bp-chart";
import { FlagBadge } from "@/components/dashboard/patient/flag-badge";
import { labResults } from "@/components/dashboard/patient/records-data";
import { useDisplayName, useMyAppointments, useMyInsurance, useMyOrders } from "@/components/dashboard/patient/use-patient";

const quickActions = [
  { label: "Book a visit", text: "Find a doctor and a time", href: "/doctors", icon: CalendarPlus },
  { label: "Order a lab test", text: "Home sample collection", href: "/marketplace?category=lab-tests", icon: FlaskConical },
  { label: "Upload a prescription", text: "We prepare it for you", href: "/dashboard/prescriptions#upload", icon: Upload },
  { label: "Message care team", text: "Replies within a day", href: "/dashboard/messages", icon: MessageCircle },
];

/** Patient home: next visit, orders, results, insurance and a blood pressure snapshot. */
export function PatientOverview() {
  const name = useDisplayName();
  const appointments = useMyAppointments();
  const orders = useMyOrders();
  const { primary } = useMyInsurance();

  const upcoming = useMemo(() => appointments.filter((a) => a.status === "upcoming"), [appointments]);
  const next = upcoming[0];
  const activeOrders = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const insurer = primary ? insurersById[primary.insurerId] : undefined;
  const latestResults = [...labResults].sort((a, b) => Number(b.flag !== "normal") - Number(a.flag !== "normal")).slice(0, 4);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-blue-700 p-6 text-white sm:p-10">
        <div className="relative z-10 max-w-xl md:pr-48">
          <p className="text-sm font-semibold text-brand-100">Patient dashboard</p>
          <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">
            {greeting}, {name.split(" ")[0]}.
          </h1>
          <p className="mt-3 text-brand-100">
            {next
              ? `Your next visit is ${formatDay(next.start)} at ${formatTime(next.start)} with ${doctorsById[next.doctorId]?.name ?? "your doctor"}.`
              : "You have no visits booked. Book one any time."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild variant="white" size="sm">
              <Link href="/doctors">
                <CalendarPlus aria-hidden /> Book a visit
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/15">
              <Link href="/dashboard/records">See my results</Link>
            </Button>
          </div>
        </div>
        <Image src="/images/dashboard/welcome.png" alt="" width={260} height={260} className="absolute -bottom-6 right-4 hidden size-56 md:block" />
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Next appointment"
          value={next ? formatDay(next.start) : "None"}
          icon={CalendarDays}
          tone="brand"
          hint={next ? `${formatTime(next.start)} · ${next.mode === "video" ? "Video" : "In clinic"}` : "Book from Find a doctor"}
        />
        <StatCard label="Active orders" value={activeOrders.length} icon={ShoppingBag} tone="blue" hint={`${orders.length} orders in total`} />
        <StatCard
          label="Insurance"
          value={primary ? primary.status.charAt(0).toUpperCase() + primary.status.slice(1) : "Not added"}
          icon={ShieldCheck}
          tone={primary?.status === "verified" ? "green" : primary?.status === "rejected" ? "red" : "coral"}
          hint={insurer ? `${insurer.name} · ${primary?.plan}` : "Add a card to see coverage"}
        />
        <StatCard label="Unread care messages" value={2} icon={MessageCircle} tone="violet" hint="From Dr. Haddad's team" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          title="Next visit"
          className="xl:col-span-2"
          action={
            <Button asChild variant="link" size="sm">
              <Link href="/dashboard/appointments">
                All visits <ArrowRight aria-hidden />
              </Link>
            </Button>
          }
        >
          {next ? <NextVisit appointmentId={next.id} /> : (
            <EmptyState
              compact
              image="/images/dashboard/empty-appointments.png"
              title="No upcoming visits"
              description="Find a doctor and pick a time that works for you."
              action={
                <Button asChild size="sm">
                  <Link href="/doctors">Book a visit</Link>
                </Button>
              }
            />
          )}
          {upcoming.length > 1 && (
            <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
              Then: {doctorsById[upcoming[1].doctorId]?.name} on {formatDay(upcoming[1].start)} at {formatTime(upcoming[1].start)}
              {upcoming.length > 2 && ` and ${upcoming.length - 2} more`}.
            </p>
          )}
        </Panel>

        <Panel title="Quick actions">
          <ul className="grid gap-2">
            {quickActions.map((a) => (
              <li key={a.label}>
                <Link
                  href={a.href}
                  className="group flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-950/50"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200">
                    <a.icon className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{a.label}</span>
                    <span className="block text-xs text-muted-foreground">{a.text}</span>
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Recent orders"
          action={
            <Button asChild variant="link" size="sm">
              <Link href="/dashboard/orders">
                All orders <ArrowRight aria-hidden />
              </Link>
            </Button>
          }
          bodyClassName="p-0"
        >
          {orders.length === 0 ? (
            <EmptyState compact image="/images/dashboard/empty-orders.png" title="No orders yet" description="Medicines, devices and lab tests you order show up here." />
          ) : (
            <ul className="divide-y divide-border">
              {orders.slice(0, 3).map((o) => (
                <li key={o.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                    <Image src={o.lines[0].image} alt="" fill sizes="96px" className="object-cover" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {o.lines[0].name}
                      {o.lines.length > 1 && <span className="font-normal text-muted-foreground"> +{o.lines.length - 1} more</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {o.id} · {formatDate(o.createdAt)} · {formatPrice(o.total)}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Latest results"
          description="From your last blood tests"
          action={
            <Button asChild variant="link" size="sm">
              <Link href="/dashboard/records">
                All results <ArrowRight aria-hidden />
              </Link>
            </Button>
          }
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-border">
            {latestResults.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{r.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Normal: {r.range} {r.unit} · {formatDate(r.date)}
                  </p>
                </div>
                <p className="font-display text-lg font-bold tabular-nums">
                  {r.value} <span className="text-xs font-medium text-muted-foreground">{r.unit}</span>
                </p>
                <FlagBadge flag={r.flag} />
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel
          title="Insurance"
          className="lg:col-span-2"
          action={
            <Button asChild variant="link" size="sm">
              <Link href="/dashboard/insurance">
                Manage <ArrowRight aria-hidden />
              </Link>
            </Button>
          }
        >
          {primary && insurer ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <InsurerLogo insurer={insurer} />
                <StatusBadge status={primary.status} />
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-surface-2 p-3">
                  <dt className="text-xs text-muted-foreground">Plan</dt>
                  <dd className="font-semibold">{primary.plan}</dd>
                </div>
                <div className="rounded-xl bg-surface-2 p-3">
                  <dt className="text-xs text-muted-foreground">Typical coverage</dt>
                  <dd className="font-semibold">{insurer.coverage}% in network</dd>
                </div>
                <div className="col-span-2 rounded-xl bg-surface-2 p-3">
                  <dt className="text-xs text-muted-foreground">Member ID</dt>
                  <dd className="font-mono font-semibold">{primary.memberId}</dd>
                </div>
              </dl>
              {primary.status === "pending" && <p className="text-xs text-muted-foreground">Our billing team is checking this card. Usually done in 1 working day.</p>}
              {primary.status === "rejected" && <p className="text-xs text-red-700 dark:text-red-300">{primary.note ?? "This card could not be verified."}</p>}
            </div>
          ) : (
            <EmptyState
              compact
              image="/images/dashboard/empty-insurance.png"
              title="No insurance card"
              description="Add your card to see what your plan pays."
              action={
                <Button asChild size="sm">
                  <Link href="/dashboard/insurance">Add a card</Link>
                </Button>
              }
            />
          )}
        </Panel>

        <Panel title="Health snapshot" description="Home blood pressure, last 14 days (mmHg)" className="lg:col-span-3">
          <BloodPressureChart />
        </Panel>
      </div>
    </div>
  );
}

function NextVisit({ appointmentId }: { appointmentId: string }) {
  const appointments = useMyAppointments();
  const a = appointments.find((x) => x.id === appointmentId);
  if (!a) return null;
  const doctor = doctorsById[a.doctorId];
  const department = doctor ? getDepartment(doctor.department) : undefined;
  const isVideo = a.mode === "video";
  const startsIn = new Date(a.start).getTime() - Date.now();
  const soon = startsIn < 30 * 60_000;

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <Avatar name={doctor?.name ?? "Doctor"} src={doctor?.photo} size={88} className="rounded-2xl" />
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold">{doctor?.name}</p>
        <p className="text-sm text-muted-foreground">
          {doctor?.title}
          {department && ` · ${department.name}`}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 font-semibold">
            <CalendarDays className="size-4 text-primary" aria-hidden /> {formatDay(a.start)}, {formatTime(a.start)}
          </span>
          <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 font-semibold")}>
            {isVideo ? <Video className="size-4 text-primary" aria-hidden /> : <Building2 className="size-4 text-primary" aria-hidden />}
            {isVideo ? "Video visit" : "In clinic"}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Reason: {a.reason}</p>
      </div>
      <div className="flex shrink-0 flex-col gap-2">
        {isVideo ? (
          <Button
            onClick={() =>
              soon
                ? toast.success("Joining your video room…", { description: "Your doctor will let you in shortly." })
                : toast.info("The video room opens 10 minutes before your visit", { description: "We will also send you a reminder." })
            }
          >
            <Video aria-hidden /> Join video
          </Button>
        ) : (
          <Button asChild>
            <Link href="/contact">
              <MapPin aria-hidden /> Directions
            </Link>
          </Button>
        )}
        <Button asChild variant="soft">
          <Link href="/dashboard/appointments">Manage visit</Link>
        </Button>
      </div>
    </div>
  );
}
