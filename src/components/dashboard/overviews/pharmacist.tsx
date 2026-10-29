"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ArrowRight, Boxes, FlaskConical, Pill, TestTube } from "lucide-react";
import { patientsById } from "@/data/patients";
import { rxPerDay } from "@/data/finance";
import { chartColors, chartTheme } from "@/lib/chart";
import { timeAgo } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { useOrders } from "@/store/orders";
import { Panel } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { labColumns } from "@/components/dashboard/pharmacy/lab-queue";
import { rxWarnings } from "@/components/dashboard/pharmacy/rx-checks";
import { useStockRows } from "@/components/dashboard/pharmacy/stock";
import { WelcomeBanner } from "@/components/dashboard/pharmacy/welcome-banner";

/** Pharmacist / lab overview: Rx checks, lab pipeline and stock alerts. */
export function PharmacistOverview() {
  const orders = useOrders((s) => s.orders);
  const stock = useStockRows();

  const pendingRx = useMemo(() => orders.filter((o) => o.rx?.status === "pending").sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [orders]);
  const labCounts = useMemo(() => {
    const counts = { scheduled: 0, collected: 0, processing: 0, resulted: 0 };
    for (const o of orders) if (o.lab) counts[o.lab.status]++;
    return counts;
  }, [orders]);
  const lowStock = stock.filter((r) => r.status !== "in-stock").sort((a, b) => a.stock / a.reorderLevel - b.stock / b.reorderLevel);
  const dueToday = labCounts.collected + labCounts.processing;
  const labTotal = Object.values(labCounts).reduce((a, b) => a + b, 0) || 1;
  const weekVerified = rxPerDay.reduce((s, d) => s + d.verified, 0);

  return (
    <div className="space-y-6">
      <WelcomeBanner
        role="pharmacist"
        summary={
          pendingRx.length
            ? `${pendingRx.length} prescription${pendingRx.length > 1 ? "s" : ""} waiting for your check and ${labCounts.scheduled} sample${labCounts.scheduled === 1 ? "" : "s"} to collect.`
            : "No prescriptions waiting. The queue is clear."
        }
      >
        <Button asChild variant="white" size="sm">
          <Link href="/dashboard/rx-queue">Start Rx checks</Link>
        </Button>
        <Button asChild size="sm" className="bg-white/15 text-white ring-1 ring-white/30 hover:bg-white/25">
          <Link href="/dashboard/lab-queue">Open lab queue</Link>
        </Button>
      </WelcomeBanner>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Rx to verify" value={pendingRx.length} icon={Pill} tone="coral" hint="Oldest first" />
        <StatCard label="Samples to collect" value={labCounts.scheduled} icon={TestTube} tone="blue" hint="Home and ward slots" />
        <StatCard label="Results due today" value={dueToday} icon={FlaskConical} tone="violet" hint="Collected or processing" />
        <StatCard label="Low-stock medicines" value={lowStock.length} icon={Boxes} tone="red" hint="At or under reorder level" />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Panel
          className="xl:col-span-3"
          title="Prescriptions to verify"
          description="Marketplace orders on hold until you approve."
          action={
            <Button asChild variant="link" size="sm">
              <Link href="/dashboard/rx-queue">
                See all <ArrowRight aria-hidden />
              </Link>
            </Button>
          }
          bodyClassName="p-0"
        >
          {pendingRx.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">All prescriptions are checked.</p>
          ) : (
            <ul className="divide-y divide-border">
              {pendingRx.slice(0, 5).map((o) => {
                const warnings = rxWarnings(o, patientsById[o.patientId]);
                return (
                  <li key={o.id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar name={o.patientName} src={patientsById[o.patientId]?.avatar} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-semibold">
                        {o.patientName}
                        {warnings.length > 0 && (
                          <Badge variant="red">
                            <AlertTriangle aria-hidden /> Check
                          </Badge>
                        )}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {o.lines
                          .filter((l) => l.rx)
                          .map((l) => l.name.split(",")[0])
                          .join(" · ")}{" "}
                        · {timeAgo(o.createdAt)}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="soft">
                      <Link href={`/dashboard/rx-queue?id=${o.id}`} aria-label={`Review prescription for ${o.patientName}`}>
                        Review
                      </Link>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel
          className="xl:col-span-2"
          title="Lab pipeline"
          description="Samples by stage right now."
          action={
            <Button asChild variant="link" size="sm">
              <Link href="/dashboard/lab-queue">
                Lab queue <ArrowRight aria-hidden />
              </Link>
            </Button>
          }
        >
          <div className="flex h-3 overflow-hidden rounded-full bg-muted" aria-hidden>
            {labColumns.map((c, i) => (
              <div
                key={c.status}
                style={{ width: `${(labCounts[c.status] / labTotal) * 100}%` }}
                className={["bg-slate-400", "bg-blue-500", "bg-violet-500", "bg-green-600"][i]}
              />
            ))}
          </div>
          <ol className="mt-5 space-y-3">
            {labColumns.map((c, i) => (
              <li key={c.status} className="flex items-center gap-3">
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white",
                    ["bg-slate-500", "bg-blue-600", "bg-violet-600", "bg-green-700"][i],
                  )}
                  aria-hidden
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{c.label}</p>
                  <p className="text-xs text-muted-foreground">{c.hint}</p>
                </div>
                <span className="font-display text-xl font-extrabold tabular-nums">{labCounts[c.status]}</span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Panel className="xl:col-span-3" title="Prescriptions checked this week" description={`${weekVerified} approved in the last 7 days.`}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rxPerDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid {...chartTheme.grid} />
                <XAxis dataKey="day" {...chartTheme.axis} />
                <YAxis allowDecimals={false} {...chartTheme.axis} />
                <Tooltip {...chartTheme.tooltip} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="verified" name="Approved" stackId="rx" fill={chartColors.teal} radius={[0, 0, 0, 0]} />
                <Bar dataKey="rejected" name="Rejected" stackId="rx" fill={chartColors.coral} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          className="xl:col-span-2"
          title="Low stock"
          action={
            <Button asChild variant="link" size="sm">
              <Link href="/dashboard/stock">
                Stock <ArrowRight aria-hidden />
              </Link>
            </Button>
          }
          bodyClassName="p-0"
        >
          {lowStock.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">Everything is above its reorder level.</p>
          ) : (
            <ul className="divide-y divide-border">
              {lowStock.slice(0, 6).map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{r.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.stock} {r.unit} left · reorder at {r.reorderLevel} · shelf {r.shelf}
                    </p>
                  </div>
                  {r.onOrder ? <Badge variant="blue">On order</Badge> : <StatusBadge status={r.status} />}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
