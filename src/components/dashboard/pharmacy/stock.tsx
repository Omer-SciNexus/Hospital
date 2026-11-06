"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AlertTriangle, Boxes, CalendarX2, PackageCheck, PackageX, Truck, Wallet } from "lucide-react";
import { roles } from "@/config/navigation";
import { daysUntil, stockItems, stockStatus, suppliers, type StockItem, type StockStatus } from "@/data/finance";
import { formatTime, timeAgo } from "@/lib/dates";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import { usePharmacy, type Reorder } from "@/store/pharmacy";
import { useSession } from "@/store/session";
import { DataTable, type ColumnDef } from "@/components/dashboard/data-table";
import { PageHeader, Panel } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { FieldError, Input, Label, NativeSelect } from "@/components/ui/form-controls";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface StockRow extends StockItem {
  status: StockStatus;
  daysLeft: number;
  value: number;
  onOrder?: Reorder;
}

/** Stock list with live overrides from the pharmacy store. Shared with the overview. */
export function useStockRows() {
  const overrides = usePharmacy((s) => s.stock);
  const reorders = usePharmacy((s) => s.reorders);
  return useMemo<StockRow[]>(
    () =>
      stockItems.map((i) => {
        const stock = overrides[i.id] ?? i.stock;
        return {
          ...i,
          stock,
          status: stockStatus(stock, i.reorderLevel),
          daysLeft: daysUntil(i.expiry),
          value: Math.round(stock * i.unitCost * 100) / 100,
          onOrder: reorders[i.id],
        };
      }),
    [overrides, reorders],
  );
}

type View = "all" | "reorder" | "expiring";

/** Pharmacy medicine stock: levels, expiry, adjustments and reorders. */
export function StockScreen() {
  const rows = useStockRows();
  const log = usePharmacy((s) => s.log);
  const receive = usePharmacy((s) => s.receive);
  const profile = useSession((s) => s.profile);
  const me = profile?.name || roles.find((r) => r.id === "pharmacist")!.person;
  const [view, setView] = useState<View>("all");
  const [adjusting, setAdjusting] = useState<StockRow | null>(null);
  const [ordering, setOrdering] = useState<StockRow | null>(null);

  const reorderRows = rows.filter((r) => r.status !== "in-stock");
  const expiringRows = rows.filter((r) => r.daysLeft <= 60).sort((a, b) => a.daysLeft - b.daysLeft);
  const data = view === "reorder" ? reorderRows : view === "expiring" ? expiringRows : rows;
  const totalValue = rows.reduce((s, r) => s + r.value, 0);

  const columns = useMemo<ColumnDef<StockRow, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Medicine",
        cell: ({ row: { original: r } }) => (
          <div className="min-w-48">
            <p className="font-semibold">{r.name}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              {r.group} · {r.form}
              {r.rx && <Badge variant="coral">Rx</Badge>}
              {r.controlled && <Badge variant="red">Controlled</Badge>}
            </p>
          </div>
        ),
      },
      { accessorKey: "batch", header: "Batch", meta: { className: "hidden md:table-cell" }, cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() as string}</span> },
      { accessorKey: "shelf", header: "Shelf", meta: { className: "hidden lg:table-cell" } },
      {
        accessorKey: "expiry",
        header: "Expiry",
        cell: ({ row: { original: r } }) => (
          <div className="whitespace-nowrap">
            <p>{formatDate(r.expiry)}</p>
            {r.daysLeft <= 60 && (
              <p className={cn("text-xs font-semibold", r.daysLeft <= 30 ? "text-red-700 dark:text-red-300" : "text-coral-700 dark:text-orange-300")}>
                {r.daysLeft <= 0 ? "Expired" : `in ${r.daysLeft} days`}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "stock",
        header: "Stock",
        cell: ({ row: { original: r } }) => (
          <div className="w-28">
            <p className="tabular-nums">
              <span className="font-bold">{r.stock}</span> <span className="text-xs text-muted-foreground">{r.unit}</span>
            </p>
            <Progress
              value={r.stock}
              max={r.reorderLevel * 3}
              tone={r.status === "out-of-stock" ? "red" : r.status === "low-stock" ? "coral" : "green"}
              className="mt-1 h-1.5"
              label={`${r.name} stock`}
            />
          </div>
        ),
      },
      { accessorKey: "reorderLevel", header: "Reorder at", meta: { className: "hidden xl:table-cell tabular-nums" } },
      { accessorKey: "value", header: "Value", meta: { className: "hidden lg:table-cell tabular-nums" }, cell: ({ getValue }) => formatPrice(getValue() as number) },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row: { original: r } }) => (
          <div className="flex flex-col items-start gap-1">
            <StatusBadge status={r.status} />
            {r.onOrder && (
              <Badge variant="blue">
                <Truck aria-hidden /> {r.onOrder.quantity} on order
              </Badge>
            )}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        cell: ({ row: { original: r } }) => (
          <div className="flex justify-end gap-1.5">
            <Button size="sm" variant="outline" onClick={() => setAdjusting(r)} aria-label={`Adjust stock for ${r.name}`}>
              Adjust
            </Button>
            {r.onOrder ? (
              <Button
                size="sm"
                variant="soft"
                onClick={() => {
                  receive(r.id, r.stock, me);
                  toast.success(`${r.onOrder!.quantity} ${r.unit} received`, { description: r.name });
                }}
                aria-label={`Receive delivery for ${r.name}`}
              >
                Receive
              </Button>
            ) : (
              <Button size="sm" variant={r.status === "in-stock" ? "ghost" : "soft"} onClick={() => setOrdering(r)} aria-label={`Reorder ${r.name}`}>
                Reorder
              </Button>
            )}
          </div>
        ),
      },
    ],
    [me, receive],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pharmacy"
        title="Medicine stock"
        description="Stock levels, batches and expiry dates for the hospital pharmacy and the online store."
        actions={
          reorderRows.filter((r) => !r.onOrder).length > 0 && (
            <Button variant="soft" onClick={() => setView("reorder")}>
              <Truck aria-hidden /> {reorderRows.filter((r) => !r.onOrder).length} need reorder
            </Button>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total stock value" value={formatPrice(Math.round(totalValue))} icon={Wallet} tone="brand" hint={`${rows.length} medicines`} />
        <StatCard label="Low stock" value={rows.filter((r) => r.status === "low-stock").length} icon={Boxes} tone="coral" hint="At or under reorder level" />
        <StatCard label="Out of stock" value={rows.filter((r) => r.status === "out-of-stock").length} icon={PackageX} tone="red" />
        <StatCard label="Expiring in 60 days" value={expiringRows.length} icon={CalendarX2} tone="amber" hint="Use first or return" />
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as View)}>
        <TabsList aria-label="Stock view">
          <TabsTrigger value="all">All medicines</TabsTrigger>
          <TabsTrigger value="reorder">
            Low & out <span className="rounded-full bg-background px-1.5 text-xs">{reorderRows.length}</span>
          </TabsTrigger>
          <TabsTrigger value="expiring">
            Expiring soon <span className="rounded-full bg-background px-1.5 text-xs">{expiringRows.length}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {view === "expiring" && expiringRows.length > 0 && (
        <div role="note" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p>
            <span className="font-bold">{expiringRows.length} batches expire within 60 days.</span> Move them to the front of the shelf, use them first, or
            return them to the supplier before the date.
          </p>
        </div>
      )}

      <DataTable
        key={view}
        columns={columns}
        data={data}
        searchPlaceholder="Search medicine, batch or shelf"
        pageSize={12}
        initialSorting={view === "expiring" ? [{ id: "expiry", desc: false }] : []}
        empty={{ title: "Nothing to show", description: "No medicines match this view.", image: "/images/dashboard/empty-search.png" }}
      />

      <Panel title="Recent stock movements" description="Adjustments and deliveries booked on this device.">
        {log.length === 0 ? (
          <p className="text-sm text-muted-foreground">No changes yet. Use Adjust or Reorder in the table above.</p>
        ) : (
          <ul className="divide-y divide-border">
            {log.slice(0, 8).map((m) => {
              const item = stockItems.find((i) => i.id === m.itemId);
              return (
                <li key={m.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-lg",
                      m.change >= 0 ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
                    )}
                  >
                    <PackageCheck className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{item?.name ?? m.itemId}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.reason} · {m.by} · {timeAgo(m.at)}, {formatTime(m.at)}
                    </p>
                  </div>
                  <span className={cn("font-bold tabular-nums", m.change >= 0 ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300")}>
                    {m.change > 0 ? "+" : ""}
                    {m.change}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <AdjustDialog item={adjusting} me={me} onClose={() => setAdjusting(null)} />
      <ReorderDialog item={ordering} onClose={() => setOrdering(null)} />
    </div>
  );
}

const adjustReasons = ["Stock count correction", "Delivery received", "Dispensed to ward", "Damaged or broken", "Expired, removed"];
const qtySchema = z.number({ error: "Enter a number." }).int("Use whole numbers.").min(0, "Can't be below 0.").max(10000, "That looks too high.");

function AdjustDialog({ item, me, onClose }: { item: StockRow | null; me: string; onClose: () => void }) {
  const adjust = usePharmacy((s) => s.adjust);
  const [value, setValue] = useState("");
  const [reason, setReason] = useState(adjustReasons[0]);
  const [error, setError] = useState<string>();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    const parsed = qtySchema.safeParse(value === "" ? NaN : Number(value));
    if (!parsed.success) return setError(parsed.error.issues[0]?.message);
    adjust(item.id, item.stock, parsed.data, reason, me);
    const diff = parsed.data - item.stock;
    toast.success("Stock updated", { description: `${item.name}: ${item.stock} → ${parsed.data} (${diff >= 0 ? "+" : ""}${diff})` });
    close();
  }

  function close() {
    setValue("");
    setReason(adjustReasons[0]);
    setError(undefined);
    onClose();
  }

  return (
    <Dialog open={!!item} onOpenChange={(v) => !v && close()}>
      <DialogContent size="sm">
        <DialogTitle>Adjust stock</DialogTitle>
        <DialogDescription>{item?.name}</DialogDescription>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <p className="rounded-xl bg-muted px-4 py-3 text-sm">
            Now on shelf {item?.shelf}: <span className="font-bold tabular-nums">{item?.stock}</span> {item?.unit}
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="adjust-qty">New count</Label>
            <Input
              id="adjust-qty"
              type="number"
              inputMode="numeric"
              min={0}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={String(item?.stock ?? "")}
              aria-invalid={!!error}
              autoFocus
            />
            <FieldError message={error} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adjust-reason">Reason</Label>
            <NativeSelect id="adjust-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
              {adjustReasons.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </NativeSelect>
          </div>
          <DialogFooter className="mt-0">
            <Button type="button" variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button type="submit">Save count</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReorderDialog({ item, onClose }: { item: StockRow | null; onClose: () => void }) {
  const reorder = usePharmacy((s) => s.reorder);
  const suggested = item ? Math.max(item.reorderLevel, item.reorderLevel * 3 - item.stock) : 0;
  const [value, setValue] = useState<string>();
  const [supplier, setSupplier] = useState<string>();
  const [urgent, setUrgent] = useState(false);
  const [error, setError] = useState<string>();

  function close() {
    setValue(undefined);
    setSupplier(undefined);
    setUrgent(false);
    setError(undefined);
    onClose();
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    const raw = value ?? String(suggested);
    const parsed = qtySchema.min(1, "Order at least 1.").safeParse(raw === "" ? NaN : Number(raw));
    if (!parsed.success) return setError(parsed.error.issues[0]?.message);
    const sup = supplier ?? item.supplier;
    reorder(item.id, { quantity: parsed.data, supplier: sup, urgent });
    toast.success("Reorder sent", { description: `${parsed.data} ${item.unit} of ${item.name} from ${sup}${urgent ? " (urgent)" : ""}.` });
    close();
  }

  return (
    <Dialog open={!!item} onOpenChange={(v) => !v && close()}>
      <DialogContent size="sm">
        <DialogTitle>Reorder</DialogTitle>
        <DialogDescription>{item?.name}</DialogDescription>
        {item && (
          <form onSubmit={submit} className="mt-5 space-y-4">
            <dl className="grid grid-cols-3 gap-2 rounded-xl bg-muted p-3 text-center text-xs">
              <div>
                <dt className="text-muted-foreground">In stock</dt>
                <dd className="font-display text-lg font-bold">{item.stock}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Reorder at</dt>
                <dd className="font-display text-lg font-bold">{item.reorderLevel}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Unit cost</dt>
                <dd className="font-display text-lg font-bold">{formatPrice(item.unitCost)}</dd>
              </div>
            </dl>
            <div className="space-y-1.5">
              <Label htmlFor="reorder-qty">Quantity ({item.unit})</Label>
              <Input
                id="reorder-qty"
                type="number"
                inputMode="numeric"
                min={1}
                value={value ?? String(suggested)}
                onChange={(e) => setValue(e.target.value)}
                aria-invalid={!!error}
                aria-describedby="reorder-hint"
              />
              <p id="reorder-hint" className="text-xs text-muted-foreground">
                Suggested {suggested} · about {formatPrice(Math.round(Number(value ?? suggested) * item.unitCost || 0))}
              </p>
              <FieldError message={error} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reorder-supplier">Supplier</Label>
              <NativeSelect id="reorder-supplier" value={supplier ?? item.supplier} onChange={(e) => setSupplier(e.target.value)}>
                {suppliers.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox id="reorder-urgent" checked={urgent} onCheckedChange={(v) => setUrgent(v === true)} />
              <Label htmlFor="reorder-urgent" className="font-medium">
                Urgent, next-morning delivery
              </Label>
            </div>
            <DialogFooter className="mt-0">
              <Button type="button" variant="ghost" onClick={close}>
                Cancel
              </Button>
              <Button type="submit">
                <Truck aria-hidden /> Send order
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
