"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlarmClock, BellRing, CircleCheck, Download, HandCoins, Wallet } from "lucide-react";
import { invoiceStatus, invoices as baseInvoices, type Invoice, type InvoiceStatus } from "@/data/finance";
import { chartColors, chartTheme } from "@/lib/chart";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import { useBilling } from "@/store/billing";
import { useOrders } from "@/store/orders";
import { DataTable, type ColumnDef } from "@/components/dashboard/data-table";
import { PageHeader, Panel } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface InvoiceRow extends Invoice {
  status: InvoiceStatus;
  ageDays: number;
  reminders: number;
}

const DAY = 86_400_000;

/** Invoices from finance.ts plus a few made from marketplace orders, with payments from the billing store. */
export function useInvoiceRows() {
  const orders = useOrders((s) => s.orders);
  const paid = useBilling((s) => s.paid);
  const reminders = useBilling((s) => s.reminders);

  return useMemo<InvoiceRow[]>(() => {
    const fromOrders: Invoice[] = orders
      .filter((o) => o.status !== "cancelled" && o.status !== "rx-review")
      .slice(0, 5)
      .map((o) => ({
        id: `INV-${o.id.replace(/\D/g, "")}`,
        patientId: o.patientId,
        patientName: o.patientName,
        description: `Order ${o.id}: ${o.lines[0].name}${o.lines.length > 1 ? ` +${o.lines.length - 1} more` : ""}`,
        issuedAt: o.createdAt,
        dueAt: new Date(new Date(o.createdAt).getTime() + 14 * DAY).toISOString(),
        insurerId: o.insurerId,
        total: Math.round((o.subtotal + o.deliveryFee) * 100) / 100,
        insurancePart: o.insurancePays,
        patientPart: o.total,
        // Card orders are paid at checkout.
        paidAt: o.payment === "card" ? o.createdAt : undefined,
        orderId: o.id,
      }));

    return [...baseInvoices, ...fromOrders]
      .map((inv) => {
        const paidAt = paid[inv.id] ?? inv.paidAt;
        return {
          ...inv,
          paidAt,
          status: invoiceStatus(inv, paidAt),
          ageDays: Math.max(0, Math.floor((Date.now() - new Date(inv.issuedAt).getTime()) / DAY)),
          reminders: reminders[inv.id]?.count ?? 0,
        };
      })
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  }, [orders, paid, reminders]);
}

const buckets = [
  { label: "0–30 days", min: 0, max: 30, color: chartColors.teal },
  { label: "31–60 days", min: 31, max: 60, color: chartColors.amber },
  { label: "61–90 days", min: 61, max: 90, color: chartColors.coral },
  { label: "90+ days", min: 91, max: Infinity, color: chartColors.red },
];

export function agingBuckets(rows: InvoiceRow[]) {
  const open = rows.filter((r) => r.status !== "paid");
  return buckets.map((b) => {
    const inBucket = open.filter((r) => r.ageDays >= b.min && r.ageDays <= b.max);
    return { label: b.label, color: b.color, amount: Math.round(inBucket.reduce((s, r) => s + r.patientPart, 0)), count: inBucket.length };
  });
}

type View = "all" | InvoiceStatus;

/** Billing: patient invoices, reminders and payments. */
export function InvoicesScreen() {
  const rows = useInvoiceRows();
  const markPaid = useBilling((s) => s.markPaid);
  const sendReminder = useBilling((s) => s.sendReminder);
  const [view, setView] = useState<View>("all");

  const open = rows.filter((r) => r.status !== "paid");
  const overdue = rows.filter((r) => r.status === "overdue");
  const now = new Date();
  const collected = rows
    .filter((r) => r.paidAt && new Date(r.paidAt).getMonth() === now.getMonth() && new Date(r.paidAt).getFullYear() === now.getFullYear())
    .reduce((s, r) => s + r.patientPart, 0);
  const aging = agingBuckets(rows);
  const data = view === "all" ? rows : rows.filter((r) => r.status === view);
  const count = (v: View) => (v === "all" ? rows.length : rows.filter((r) => r.status === v).length);

  const columns = useMemo<ColumnDef<InvoiceRow, unknown>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Invoice",
        cell: ({ row: { original: r } }) => (
          <div className="min-w-40">
            <p className="font-mono text-xs font-bold">{r.id}</p>
            <p className="line-clamp-1 text-xs text-muted-foreground">{r.description}</p>
          </div>
        ),
      },
      { accessorKey: "patientName", header: "Patient", cell: ({ getValue }) => <span className="whitespace-nowrap font-semibold">{getValue() as string}</span> },
      { accessorKey: "issuedAt", header: "Date", meta: { className: "hidden md:table-cell whitespace-nowrap" }, cell: ({ getValue }) => formatDate(getValue() as string) },
      {
        accessorKey: "dueAt",
        header: "Due",
        meta: { className: "hidden md:table-cell whitespace-nowrap" },
        cell: ({ row: { original: r } }) => (
          <div>
            <p>{formatDate(r.dueAt)}</p>
            {r.status === "overdue" && (
              <p className="text-xs font-semibold text-red-700 dark:text-red-300">{Math.floor((Date.now() - new Date(r.dueAt).getTime()) / DAY)} days late</p>
            )}
          </div>
        ),
      },
      { accessorKey: "total", header: "Total", meta: { className: "hidden lg:table-cell tabular-nums text-right" }, cell: ({ getValue }) => formatPrice(getValue() as number) },
      {
        accessorKey: "insurancePart",
        header: "Insurance",
        meta: { className: "hidden xl:table-cell tabular-nums text-right" },
        cell: ({ getValue }) => <span className="text-brand-700 dark:text-brand-300">{formatPrice(getValue() as number)}</span>,
      },
      { accessorKey: "patientPart", header: "Patient", meta: { className: "tabular-nums text-right font-bold" }, cell: ({ getValue }) => formatPrice(getValue() as number) },
      { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue() as string} /> },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        cell: ({ row: { original: r } }) => (
          <div className="flex justify-end gap-1">
            {r.status !== "paid" && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative size-9"
                  aria-label={`Send payment reminder to ${r.patientName}${r.reminders ? ` (${r.reminders} sent)` : ""}`}
                  onClick={() => {
                    sendReminder(r.id);
                    toast.success(`Reminder sent to ${r.patientName}`, {
                      description: `${r.id} · ${formatPrice(r.patientPart)} · reminder ${r.reminders + 1}`,
                    });
                  }}
                >
                  <BellRing aria-hidden />
                  {r.reminders > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-coral-700 text-[10px] font-bold text-white" aria-hidden>
                      {r.reminders}
                    </span>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 text-green-700 dark:text-green-300"
                  aria-label={`Mark ${r.id} as paid`}
                  onClick={() => {
                    markPaid(r.id);
                    toast.success(`${r.id} marked as paid`, { description: `${formatPrice(r.patientPart)} from ${r.patientName}.` });
                  }}
                >
                  <CircleCheck aria-hidden />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-9"
              aria-label={`Download ${r.id} as PDF`}
              onClick={() => toast(`${r.id}.pdf downloaded`, { description: `Invoice for ${r.patientName}.` })}
            >
              <Download aria-hidden />
            </Button>
          </div>
        ),
      },
    ],
    [markPaid, sendReminder],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Billing"
        title="Invoices"
        description="What patients owe after insurance. Send reminders, record payments and download copies."
        actions={
          overdue.length > 0 && (
            <Button
              variant="soft"
              onClick={() => {
                overdue.forEach((r) => sendReminder(r.id));
                toast.success(`${overdue.length} reminders sent`, { description: "Every overdue patient got an email and a text." });
              }}
            >
              <BellRing aria-hidden /> Remind all overdue
            </Button>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Outstanding" value={formatPrice(Math.round(open.reduce((s, r) => s + r.patientPart, 0)))} icon={Wallet} tone="blue" hint={`${open.length} invoices`} />
        <StatCard label="Overdue" value={formatPrice(Math.round(overdue.reduce((s, r) => s + r.patientPart, 0)))} icon={AlarmClock} tone="red" hint={`${overdue.length} past due date`} />
        <StatCard label="Collected this month" value={formatPrice(Math.round(collected))} icon={HandCoins} tone="green" delta={12} hint="vs last month" />
        <StatCard
          label="Reminders sent"
          value={rows.reduce((s, r) => s + r.reminders, 0)}
          icon={BellRing}
          tone="coral"
          hint="From this screen"
        />
      </div>

      <Panel title="Aging of unpaid invoices" description="Patient share still open, by days since the invoice date.">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aging} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid {...chartTheme.grid} />
                <XAxis dataKey="label" {...chartTheme.axis} />
                <YAxis {...chartTheme.axis} tickFormatter={(v: number) => (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`)} width={48} />
                <Tooltip {...chartTheme.tooltip} formatter={(v) => [formatPrice(Number(v)), "Open"]} />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {aging.map((a) => (
                    <Cell key={a.label} fill={a.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-2 self-center">
            {aging.map((a) => (
              <li key={a.label} className="flex items-center gap-3 text-sm">
                <span className="size-3 shrink-0 rounded-full" style={{ background: a.color }} aria-hidden />
                <span className="flex-1">{a.label}</span>
                <span className="text-xs text-muted-foreground">{a.count}</span>
                <span className="w-20 text-right font-semibold tabular-nums">{formatPrice(a.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      </Panel>

      <Tabs value={view} onValueChange={(v) => setView(v as View)}>
        <TabsList aria-label="Invoice status">
          {(["all", "unpaid", "overdue", "paid"] as const).map((v) => (
            <TabsTrigger key={v} value={v} className={cn(v === "overdue" && "data-[state=active]:text-red-700 dark:data-[state=active]:text-red-300")}>
              {v === "all" ? "All" : v.charAt(0).toUpperCase() + v.slice(1)}
              <span className="rounded-full bg-background px-1.5 text-xs tabular-nums">{count(v)}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="Search invoice or patient"
        empty={{ title: "No invoices here", image: "/images/dashboard/empty-claims.png" }}
      />
    </div>
  );
}
