"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, CalendarCheck, FileCheck, FileClock, IdCard, type LucideIcon } from "lucide-react";
import { insurersById } from "@/data/insurers";
import { patientsById } from "@/data/patients";
import { payerStats } from "@/data/finance";
import { chartColors, chartTheme } from "@/lib/chart";
import { timeAgo } from "@/lib/dates";
import { cn, formatPrice } from "@/lib/utils";
import { useInsurance } from "@/store/insurance";
import { Panel } from "@/components/dashboard/page-header";
import { StatCard, toneClasses, type Tone } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { WelcomeBanner } from "@/components/dashboard/pharmacy/welcome-banner";

const patientName = (id: string) => patientsById[id]?.name ?? id;

/** Billing / insurance overview: work queues, claim outcomes and payer stats. */
export function BillingOverview() {
  const cards = useInsurance((s) => s.cards);
  const claims = useInsurance((s) => s.claims);
  const preapprovals = useInsurance((s) => s.preapprovals);

  const pendingCards = useMemo(() => cards.filter((c) => c.status === "pending").sort((a, b) => a.addedAt.localeCompare(b.addedAt)), [cards]);
  const drafts = useMemo(() => claims.filter((c) => c.status === "draft"), [claims]);
  const awaiting = useMemo(() => claims.filter((c) => c.status === "submitted" || c.status === "in-review"), [claims]);
  const openPa = useMemo(
    () =>
      preapprovals
        .filter((p) => p.status === "requested" || p.status === "in-review")
        .sort((a, b) => Number(b.urgency === "urgent") - Number(a.urgency === "urgent") || a.requestedAt.localeCompare(b.requestedAt)),
    [preapprovals],
  );

  const outcome = useMemo(() => {
    const approved = claims.filter((c) => c.status === "approved").length;
    const partial = claims.filter((c) => c.status === "partial").length;
    const denied = claims.filter((c) => c.status === "denied").length;
    const total = approved + partial + denied;
    return {
      rate: total ? Math.round(((approved + partial) / total) * 100) : 0,
      total,
      data: [
        { name: "Approved", value: approved, color: chartColors.green },
        { name: "Partly approved", value: partial, color: chartColors.amber },
        { name: "Denied", value: denied, color: chartColors.red },
      ],
    };
  }, [claims]);

  const byInsurer = useMemo(() => {
    const map = new Map<string, { billed: number; pays: number }>();
    for (const c of claims) {
      const row = map.get(c.insurerId) ?? { billed: 0, pays: 0 };
      row.billed += c.amount;
      row.pays += c.status === "denied" ? 0 : c.insurerPays;
      map.set(c.insurerId, row);
    }
    return [...map.entries()]
      .map(([id, v]) => ({ name: insurersById[id]?.name.split(" ")[0] ?? id, billed: Math.round(v.billed), pays: Math.round(v.pays) }))
      .sort((a, b) => b.billed - a.billed);
  }, [claims]);

  const decisions = useMemo(() => {
    const items: { id: string; at: string; status: string; title: string; detail: string; href: string }[] = [];
    for (const c of cards)
      if (c.decidedAt) items.push({ id: c.id, at: c.decidedAt, status: c.status, title: `Card ${c.status}`, detail: `${patientName(c.patientId)} · ${insurersById[c.insurerId]?.name ?? ""}`, href: `/dashboard/verifications?id=${c.id}` });
    for (const c of claims)
      if (c.decidedAt) items.push({ id: c.id, at: c.decidedAt, status: c.status, title: `${c.id} ${c.status === "partial" ? "partly approved" : c.status}`, detail: `${patientName(c.patientId)} · ${c.title} · ${formatPrice(c.insurerPays)}`, href: `/dashboard/claims?id=${c.id}` });
    for (const p of preapprovals)
      if (p.decidedAt) items.push({ id: p.id, at: p.decidedAt, status: p.status, title: `Pre-approval ${p.status}`, detail: `${patientName(p.patientId)} · ${p.procedure}`, href: `/dashboard/preapprovals?id=${p.id}` });
    return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 7);
  }, [cards, claims, preapprovals]);

  const queues: { title: string; href: string; icon: LucideIcon; tone: Tone; count: number; empty: string; items: { id: string; label: string; meta: string; href: string }[] }[] = [
    {
      title: "Card checks",
      href: "/dashboard/verifications",
      icon: IdCard,
      tone: "coral",
      count: pendingCards.length,
      empty: "No cards to check.",
      items: pendingCards.map((c) => ({ id: c.id, label: patientName(c.patientId), meta: `${insurersById[c.insurerId]?.name} · ${timeAgo(c.addedAt)}`, href: `/dashboard/verifications?id=${c.id}` })),
    },
    {
      title: "Claims to send",
      href: "/dashboard/claims",
      icon: FileClock,
      tone: "blue",
      count: drafts.length,
      empty: "No drafts waiting.",
      items: drafts.map((c) => ({ id: c.id, label: c.title, meta: `${patientName(c.patientId)} · ${formatPrice(c.amount)}`, href: `/dashboard/claims?id=${c.id}` })),
    },
    {
      title: "Pre-approvals",
      href: "/dashboard/preapprovals",
      icon: CalendarCheck,
      tone: "violet",
      count: openPa.length,
      empty: "No requests waiting.",
      items: openPa.map((p) => ({ id: p.id, label: p.procedure, meta: `${p.urgency === "urgent" ? "Urgent · " : ""}${patientName(p.patientId)} · ${timeAgo(p.requestedAt)}`, href: `/dashboard/preapprovals?id=${p.id}` })),
    },
  ];

  return (
    <div className="space-y-6">
      <WelcomeBanner
        role="billing"
        summary={`${pendingCards.length} card${pendingCards.length === 1 ? "" : "s"} to check, ${drafts.length} claim${drafts.length === 1 ? "" : "s"} to send and ${openPa.length} pre-approval${openPa.length === 1 ? "" : "s"} waiting.`}
      >
        <Button asChild variant="white" size="sm">
          <Link href="/dashboard/verifications">Check cards</Link>
        </Button>
        <Button asChild size="sm" className="bg-white/15 text-white ring-1 ring-white/30 hover:bg-white/25">
          <Link href="/dashboard/claims">Open claims</Link>
        </Button>
      </WelcomeBanner>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Cards to verify" value={pendingCards.length} icon={IdCard} tone="coral" hint="Added by patients" />
        <StatCard label="Claims to send" value={drafts.length} icon={FileClock} tone="blue" hint={formatPrice(drafts.reduce((s, c) => s + c.amount, 0))} />
        <StatCard label="Awaiting insurer" value={awaiting.length} icon={FileCheck} tone="violet" hint={`${formatPrice(awaiting.reduce((s, c) => s + c.insurerPays, 0))} expected`} />
        <StatCard label="Pre-approvals waiting" value={openPa.length} icon={CalendarCheck} tone="amber" hint={`${openPa.filter((p) => p.urgency === "urgent").length} urgent`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {queues.map((q) => (
          <Panel
            key={q.title}
            title={
              <span className="flex items-center gap-2">
                <span className={cn("grid size-8 place-items-center rounded-lg", toneClasses[q.tone])}>
                  <q.icon className="size-4" aria-hidden />
                </span>
                {q.title}
                <span className="rounded-full bg-muted px-2 text-xs tabular-nums">{q.count}</span>
              </span>
            }
            action={
              <Button asChild variant="link" size="sm">
                <Link href={q.href} aria-label={`Open ${q.title}`}>
                  Open <ArrowRight aria-hidden />
                </Link>
              </Button>
            }
            bodyClassName="p-0"
          >
            {q.items.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">{q.empty}</p>
            ) : (
              <ul className="divide-y divide-border">
                {q.items.slice(0, 3).map((i) => (
                  <li key={i.id}>
                    <Link href={i.href} className="block px-5 py-3 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none">
                      <p className="truncate text-sm font-semibold">{i.label}</p>
                      <p className="truncate text-xs text-muted-foreground">{i.meta}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Panel className="xl:col-span-2" title="Claim approval rate" description={`${outcome.total} decided claims`}>
          <div className="relative h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={outcome.data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="88%" paddingAngle={3} stroke="none">
                  {outcome.data.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip {...chartTheme.tooltip} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="font-display text-3xl font-extrabold tabular-nums">{outcome.rate}%</p>
                <p className="text-xs text-muted-foreground">paid in full or part</p>
              </div>
            </div>
          </div>
          <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
            {outcome.data.map((d) => (
              <li key={d.name} className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full" style={{ background: d.color }} aria-hidden />
                {d.name} <span className="font-bold tabular-nums">{d.value}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="xl:col-span-3" title="Claims by insurer" description="Billed amount and what insurers pay or are expected to pay.">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byInsurer} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid {...chartTheme.grid} />
                <XAxis dataKey="name" {...chartTheme.axis} interval={0} />
                <YAxis {...chartTheme.axis} width={48} tickFormatter={(v: number) => (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`)} />
                <Tooltip {...chartTheme.tooltip} formatter={(v) => formatPrice(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="billed" name="Billed" fill={chartColors.blue} radius={[6, 6, 0, 0]} />
                <Bar dataKey="pays" name="Insurer pays" fill={chartColors.teal} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Panel className="xl:col-span-3" title="Recent decisions" description="Cards, claims and pre-approvals." bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {decisions.map((d) => (
              <li key={d.id}>
                <Link href={d.href} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold first-letter:uppercase">{d.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{d.detail}</p>
                  </div>
                  <StatusBadge status={d.status} className="hidden sm:inline-flex" />
                  <span className="w-20 shrink-0 text-right text-xs text-muted-foreground">{timeAgo(d.at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="xl:col-span-2" title="Payer performance" description="Last 90 days.">
          <ul className="space-y-4">
            {payerStats.slice(0, 6).map((p) => (
              <li key={p.insurerId}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-semibold">{insurersById[p.insurerId]?.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    pays in ~{p.avgDaysToPay} d · <span className="font-bold text-foreground">{p.approvalRate}%</span>
                  </span>
                </div>
                <Progress
                  value={p.approvalRate}
                  tone={p.approvalRate >= 88 ? "green" : p.approvalRate >= 80 ? "amber" : "red"}
                  className="mt-1.5"
                  label={`${insurersById[p.insurerId]?.name} approval rate`}
                />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
