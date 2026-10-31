"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BedDouble, Boxes, ChartLine, CircleDollarSign, Hourglass, IdCard, Moon, ShoppingBag, TriangleAlert, UserPlus } from "lucide-react";
import { roles } from "@/config/navigation";
import { site } from "@/config/site";
import { bedOccupancyYesterday, bedsByGroup, bedTotals, dayStats, deptName, erNow, lastDays, marketplaceBaseToday, pctChange, staffing } from "@/data/operations";
import { useSession } from "@/store/session";
import { useOrders } from "@/store/orders";
import { useInsurance } from "@/store/insurance";
import { useInventory } from "@/store/admin";
import { formatPrice } from "@/lib/utils";
import { isToday, timeAgo } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { AdmissionsChart, BedsByGroupChart, RevenueStreamsChart } from "@/components/dashboard/admin/charts";
import { ErStatusCard } from "@/components/dashboard/admin/er-status";
import { money, number } from "@/components/dashboard/admin/chart-kit";

const dayLabel = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const weekdayLabel = new Intl.DateTimeFormat("en-US", { weekday: "short" });

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

/** Hospital administrator home: capacity, ER, revenue, alerts and marketplace orders. */
export function AdminOverview() {
  const profile = useSession((s) => s.profile);
  const name = profile?.name || roles.find((r) => r.id === "admin")!.person;
  const orders = useOrders((s) => s.orders);
  const cards = useInsurance((s) => s.cards);
  const inventory = useInventory();

  const occupancy = Math.round((bedTotals.occupied / bedTotals.total) * 1000) / 10;
  const today = useMemo(() => dayStats(0), []);
  const lastWeek = useMemo(() => dayStats(-7), []);
  const fourteen = useMemo(() => lastDays(14).map((d) => ({ label: dayLabel.format(d.date), admissions: d.admissions, discharges: d.discharges })), []);
  const week = useMemo(
    () => lastDays(7).map((d) => ({ label: weekdayLabel.format(d.date), inpatient: d.inpatient, outpatient: d.outpatient, pharmacy: d.pharmacy, lab: d.lab, marketplace: d.marketplace })),
    [],
  );

  const liveOrders = orders.filter((o) => o.status !== "cancelled");
  const sumOn = (offset: number) =>
    liveOrders
      .filter((o) => new Date(o.createdAt).toDateString() === new Date(Date.now() + offset * 86_400_000).toDateString())
      .reduce((s, o) => s + o.subtotal, 0);
  const mpToday = marketplaceBaseToday() + liveOrders.filter((o) => isToday(o.createdAt)).reduce((s, o) => s + o.subtotal, 0);
  const mpYesterday = dayStats(-1).marketplace + sumOn(-1);
  const recent = useMemo(() => [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5), [orders]);

  const lowStock = inventory.filter((i) => i.status !== "in-stock" && !i.onOrder);
  const nightGaps = staffing.openShifts.filter((s) => s.shift === "Night");
  const pendingCards = cards.filter((c) => c.status === "pending").length;

  const alerts = [
    lowStock.length > 0 && {
      id: "stock",
      icon: Boxes,
      level: lowStock.some((i) => i.status === "out-of-stock") ? "urgent" : "due",
      label: lowStock.some((i) => i.status === "out-of-stock") ? "Urgent" : "Soon",
      title: `${lowStock.length} supplies low or out of stock`,
      text: lowStock
        .slice(0, 3)
        .map((i) => i.name)
        .join(", "),
      href: "/dashboard/inventory",
      cta: "Reorder",
    },
    nightGaps.length > 0 && {
      id: "night",
      icon: Moon,
      level: "urgent",
      label: "Urgent",
      title: `Night shift short by ${nightGaps.reduce((s, g) => s + g.count, 0)} staff`,
      text: nightGaps.map((g) => `${deptName(g.department)} (${g.count} ${g.role.toLowerCase()})`).join(", "),
      href: "/dashboard/staff",
      cta: "Fill shifts",
    },
    pendingCards > 0 && {
      id: "cards",
      icon: IdCard,
      level: "pending",
      label: "Waiting",
      title: `${pendingCards} insurance card${pendingCards === 1 ? "" : "s"} waiting for a check`,
      text: "The billing team checks new cards before claims can go out. Analytics shows revenue by insurer.",
      href: "/dashboard/analytics",
      cta: "View payer mix",
    },
  ].filter(Boolean) as { id: string; icon: typeof Boxes; level: string; label: string; title: string; text: string; href: string; cta: string }[];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-blue-700 p-6 text-white sm:p-8">
        <div className="relative z-10 max-w-xl">
          <p className="text-sm font-semibold text-brand-100">Operations console · {site.name}</p>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-4xl">
            {greeting()}, {name.split(" ")[0]}.
          </h1>
          <p className="mt-3 text-brand-50">
            Beds are at {occupancy}% with {bedTotals.total - bedTotals.occupied} free. The ER average wait is {erNow.avgWait} minutes, and {alerts.length} thing
            {alerts.length === 1 ? "" : "s"} need{alerts.length === 1 ? "s" : ""} your eye today.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild variant="white" size="sm">
              <Link href="/dashboard/analytics">
                <ChartLine aria-hidden /> Open analytics
              </Link>
            </Button>
            <Button asChild size="sm" className="bg-white/15 text-white ring-1 ring-white/30 hover:bg-white/25">
              <Link href="/dashboard/staff">
                <UserPlus aria-hidden /> Manage staff
              </Link>
            </Button>
          </div>
        </div>
        <Image src="/images/dashboard/welcome.png" alt="" width={260} height={260} className="absolute -bottom-6 right-4 hidden size-52 md:block" />
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Bed occupancy"
          value={`${occupancy}%`}
          icon={BedDouble}
          tone="brand"
          delta={Math.round((occupancy - bedOccupancyYesterday) * 10) / 10}
          goodWhen="down"
          hint={`${number(bedTotals.occupied)} of ${number(bedTotals.total)} beds`}
        />
        <StatCard
          label="ER average wait"
          value={`${erNow.avgWait} min`}
          icon={Hourglass}
          tone="coral"
          delta={pctChange(erNow.avgWait, erNow.avgWaitLastWeek)}
          goodWhen="down"
          hint="vs last week"
        />
        <StatCard label="Admissions today" value={today.admissions} icon={UserPlus} tone="blue" delta={pctChange(today.admissions, lastWeek.admissions)} hint="vs same day last week" />
        <StatCard label="Marketplace revenue today" value={money(mpToday)} icon={CircleDollarSign} tone="green" delta={pctChange(mpToday, mpYesterday)} hint="vs yesterday" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          title="Admissions vs discharges"
          description="Last 14 days, all departments"
          className="xl:col-span-2"
          action={
            <Link href="/dashboard/analytics" className="text-sm font-semibold text-primary hover:underline">
              Analytics
            </Link>
          }
        >
          <AdmissionsChart data={fourteen} />
        </Panel>
        <ErStatusCard />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Panel title="Revenue by stream" description="Last 7 days" className="xl:col-span-3">
          <RevenueStreamsChart data={week} />
        </Panel>
        <Panel
          title="Bed occupancy by group"
          description={`${number(bedTotals.occupied)} of ${number(bedTotals.total)} beds in use`}
          className="xl:col-span-2"
          action={
            <Link href="/dashboard/departments" className="text-sm font-semibold text-primary hover:underline">
              Departments
            </Link>
          }
        >
          <BedsByGroupChart data={bedsByGroup} />
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Needs attention" description="Alerts across the hospital" bodyClassName="p-0">
          {alerts.length === 0 ? (
            <EmptyState compact image="/images/dashboard/empty-search.png" title="All clear" description="No alerts right now." />
          ) : (
            <ul className="divide-y divide-border">
              {alerts.map((a) => (
                <li key={a.id} className="flex gap-3 px-5 py-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-foreground">
                    <a.icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{a.title}</p>
                      <StatusBadge status={a.level} label={a.label} />
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{a.text}</p>
                  </div>
                  <Link href={a.href} className="inline-flex shrink-0 items-center gap-1 self-center text-sm font-semibold text-primary hover:underline">
                    <span className="hidden sm:inline">{a.cta}</span>
                    <ArrowRight className="size-4" aria-hidden />
                    <span className="sr-only sm:hidden">{a.cta}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="flex items-center gap-1.5 border-t border-border px-5 py-3 text-xs text-muted-foreground">
            <TriangleAlert className="size-3.5" aria-hidden /> Alerts update as teams act on them.
          </p>
        </Panel>

        <Panel
          title="Recent marketplace orders"
          description={`${orders.length} orders in the system`}
          bodyClassName="p-0"
          action={
            <Link href="/dashboard/catalog" className="text-sm font-semibold text-primary hover:underline">
              Catalog
            </Link>
          }
        >
          {recent.length === 0 ? (
            <EmptyState compact image="/images/dashboard/empty-orders.png" title="No orders yet" />
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((o) => (
                <li key={o.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200">
                    <ShoppingBag className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {o.patientName} <span className="font-normal text-muted-foreground">· {o.id}</span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {o.lines.length} item{o.lines.length === 1 ? "" : "s"} · {o.lines[0]?.name} · {timeAgo(o.createdAt)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-bold tabular-nums">{formatPrice(o.subtotal)}</p>
                    <StatusBadge status={o.status} className="mt-1" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
