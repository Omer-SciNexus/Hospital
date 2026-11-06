"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BedDouble, Clock, ExternalLink, MapPin, Search, Star, Users } from "lucide-react";
import { departmentGroups, departmentIcon, departmentsBySlug, type DepartmentGroupId } from "@/config/departments";
import { doctors } from "@/data/doctors";
import { bedTotals, departmentLeads, departmentStats, departmentTrend, type DepartmentStat, type DeptStatus } from "@/data/operations";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { MiniTrend } from "./charts";
import { number } from "./chart-kit";

const statusBadge: Record<DeptStatus, { status: string; label: string }> = {
  open: { status: "active", label: "Open" },
  busy: { status: "away", label: "Busy" },
  full: { status: "critical", label: "Full" },
};

const groupName = Object.fromEntries(departmentGroups.map((g) => [g.id, g.name])) as Record<DepartmentGroupId, string>;

function headOf(slug: string) {
  const list = doctors.filter((d) => d.department === slug);
  const head = list.find((d) => d.title.startsWith("Head")) ?? list[0];
  return head ? { name: head.name, photo: head.photo, id: head.id } : { name: departmentLeads[slug] ?? "To be appointed", photo: undefined, id: undefined };
}

const occTone = (d: DepartmentStat) => (d.beds && d.occupied / d.beds >= 0.95 ? "red" : d.beds && d.occupied / d.beds >= 0.88 ? "coral" : "brand");

/** Live view of all departments: beds, patients, waits and status, with a detail dialog. */
export function AdminDepartments() {
  const [group, setGroup] = useState<"all" | DepartmentGroupId>("all");
  const [q, setQ] = useState("");
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return departmentStats.filter((d) => (group === "all" || d.group === group) && (!term || d.name.toLowerCase().includes(term) || headOf(d.slug).name.toLowerCase().includes(term)));
  }, [group, q]);

  const counts = { busy: departmentStats.filter((d) => d.status === "busy").length, full: departmentStats.filter((d) => d.status === "full").length };
  const patients = departmentStats.reduce((s, d) => s + d.patientsToday, 0);
  const selected = openSlug ? departmentStats.find((d) => d.slug === openSlug) : undefined;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Operations" title="Departments" description="Capacity, patients and waits for every department, updated through the day." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Departments" value={departmentStats.length} icon={MapPin} tone="brand" hint={`${departmentGroups.length} groups`} />
        <StatCard label="Beds in use" value={`${number(bedTotals.occupied)} / ${number(bedTotals.total)}`} icon={BedDouble} tone="blue" hint={`${Math.round((bedTotals.occupied / bedTotals.total) * 100)}% occupied`} />
        <StatCard label="Patients today" value={number(patients)} icon={Users} tone="green" hint="Visits and admissions" />
        <StatCard label="Busy or full" value={counts.busy + counts.full} icon={Clock} tone="coral" hint={`${counts.full} full, ${counts.busy} busy`} />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={group} onValueChange={(v) => setGroup(v as typeof group)} className="min-w-0">
          <TabsList aria-label="Department group">
            <TabsTrigger value="all">All</TabsTrigger>
            {departmentGroups.map((g) => (
              <TabsTrigger key={g.id} value={g.id}>
                {g.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <label className="relative block w-full lg:max-w-xs">
          <span className="sr-only">Search departments</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search department or head"
            className="h-10 w-full rounded-full border border-border bg-surface pl-9 pr-4 text-sm focus-visible:border-brand-500 focus-visible:outline-none"
          />
        </label>
      </div>

      <p className="sr-only" aria-live="polite">
        {list.length} departments shown
      </p>

      {list.length === 0 ? (
        <EmptyState image="/images/dashboard/empty-search.png" title="No departments found" description="Try another name or group." />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((d) => {
            const head = headOf(d.slug);
            const b = statusBadge[d.status];
            return (
              <li key={d.slug}>
                <button
                  type="button"
                  onClick={() => setOpenSlug(d.slug)}
                  className="group flex h-full w-full flex-col rounded-2xl border border-border bg-surface p-5 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
                >
                  <div className="flex items-start gap-3">
                    <Image src={departmentIcon(d.slug)} alt="" width={48} height={48} className="size-12 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold group-hover:text-primary">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{groupName[d.group]}</p>
                    </div>
                    <StatusBadge status={b.status} label={b.label} />
                  </div>
                  <p className="mt-3 truncate text-sm">
                    <span className="text-muted-foreground">Head: </span>
                    <span className="font-semibold">{head.name}</span>
                  </p>
                  <div className="mt-4">
                    {d.beds ? (
                      <>
                        <div className="mb-1.5 flex justify-between text-xs">
                          <span className="font-semibold">Beds</span>
                          <span className="tabular-nums text-muted-foreground">
                            {d.occupied} / {d.beds} used
                          </span>
                        </div>
                        <Progress value={d.occupied} max={d.beds} tone={occTone(d)} label={`${d.name} beds in use`} />
                      </>
                    ) : (
                      <p className="flex h-[26px] items-center text-xs text-muted-foreground">Outpatient only, no beds</p>
                    )}
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-3 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Patients today</dt>
                      <dd className="font-bold tabular-nums">{d.patientsToday}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Wait time</dt>
                      <dd className="font-bold tabular-nums">{d.waitMin ? `${d.waitMin} min` : "No queue"}</dd>
                    </div>
                  </dl>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setOpenSlug(null)}>
        <DialogContent size="lg">{selected && <DepartmentDetail d={selected} />}</DialogContent>
      </Dialog>
    </div>
  );
}

function DepartmentDetail({ d }: { d: DepartmentStat }) {
  const info = departmentsBySlug[d.slug];
  const head = headOf(d.slug);
  const trend = useMemo(() => departmentTrend(d.slug), [d.slug]);
  const b = statusBadge[d.status];
  const stats = [
    { label: "Beds", value: d.beds ? `${d.occupied} / ${d.beds}` : "None" },
    { label: "Patients today", value: d.patientsToday },
    { label: "Wait time", value: d.waitMin ? `${d.waitMin} min` : "No queue" },
    { label: "Rating", value: d.satisfaction.toFixed(1) },
  ];
  return (
    <>
      <div className="flex items-start gap-4 pr-8">
        <Image src={departmentIcon(d.slug)} alt="" width={56} height={56} className="size-14 shrink-0" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle>{d.name}</DialogTitle>
            <StatusBadge status={b.status} label={b.label} />
          </div>
          <DialogDescription>{info?.summary}</DialogDescription>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-surface-2 p-3">
            <dt className="text-xs text-muted-foreground">{s.label}</dt>
            <dd className="mt-0.5 flex items-center gap-1 font-display text-xl font-extrabold tabular-nums">
              {s.label === "Rating" && <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />}
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-6">
        <h3 className="mb-2 text-sm font-bold">Patients per day, last 14 days</h3>
        <MiniTrend data={trend} name={d.name} />
      </div>

      <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">Head of department</dt>
          <dd className="font-semibold">{head.name}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Location</dt>
          <dd className="font-semibold">{info?.location}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Hours</dt>
          <dd className="font-semibold">{info?.hours}</dd>
        </div>
      </dl>

      <div className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end")}>
        {head.id && (
          <Button asChild variant="ghost">
            <Link href={`/doctors/${head.id}`}>Doctor profile</Link>
          </Button>
        )}
        <Button asChild>
          <Link href={`/departments/${d.slug}`}>
            Public page <ExternalLink aria-hidden />
          </Link>
        </Button>
      </div>
    </>
  );
}
