"use client";

import { useMemo, useState } from "react";
import { Boxes, CircleDollarSign, Minus, PackageCheck, PackagePlus, PackageX, Plus, SlidersHorizontal, TriangleAlert, Truck } from "lucide-react";
import { toast } from "sonner";
import { supplyCategories, supplyLocations } from "@/data/operations";
import { useAdmin, useInventory, type InventoryRow } from "@/store/admin";
import { formatPrice } from "@/lib/utils";
import { makeRef, timeAgo } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { FieldError, Input, Label, NativeSelect } from "@/components/ui/form-controls";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { DataTable, type ColumnDef } from "@/components/dashboard/data-table";
import { money, number } from "./chart-kit";

type Action = { type: "reorder" | "adjust"; id: string } | null;

/** Hospital supplies: stock against reorder levels, reorders, stock adjustments and stock value. */
export function AdminInventory() {
  const rows = useInventory();
  const receiveOrder = useAdmin((s) => s.receiveOrder);
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("");
  const [action, setAction] = useState<Action>(null);

  const filtered = useMemo(
    () => rows.filter((r) => (!category || r.category === category) && (!location || r.location.startsWith(location)) && (!status || r.status === status)),
    [rows, category, location, status],
  );
  const value = rows.reduce((s, r) => s + r.value, 0);
  const low = rows.filter((r) => r.status === "low-stock");
  const out = rows.filter((r) => r.status === "out-of-stock");
  const needAction = [...out, ...low].filter((r) => !r.onOrder);
  const onOrder = rows.filter((r) => r.onOrder);
  const current = action ? rows.find((r) => r.id === action.id) : undefined;

  const columns: ColumnDef<InventoryRow, unknown>[] = [
    {
      accessorKey: "name",
      header: "Item",
      cell: ({ row }) => (
        <div className="min-w-44">
          <p className="font-semibold">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.unit}
            <span className="md:hidden"> · {row.original.category}</span>
          </p>
        </div>
      ),
    },
    { accessorKey: "category", header: "Category", meta: { className: "hidden md:table-cell" } },
    { accessorKey: "location", header: "Location", meta: { className: "hidden xl:table-cell text-muted-foreground" } },
    {
      accessorKey: "stock",
      header: "Stock",
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="w-32">
            <p className="text-sm tabular-nums">
              <span className="font-bold">{number(r.stock)}</span>
              <span className="text-xs text-muted-foreground"> / min {number(r.reorderLevel)}</span>
            </p>
            <Progress
              className="mt-1 h-1.5"
              value={r.stock}
              max={r.reorderLevel * 3}
              tone={r.status === "out-of-stock" ? "red" : r.status === "low-stock" ? "coral" : "green"}
              label={`${r.name}: ${r.stock} in stock, reorder at ${r.reorderLevel}`}
            />
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex flex-col items-start gap-1">
          <StatusBadge status={row.original.status} />
          {row.original.onOrder && (
            <Badge variant="blue">
              <Truck aria-hidden /> {number(row.original.onOrder.qty)} on order
            </Badge>
          )}
        </div>
      ),
    },
    { accessorKey: "supplier", header: "Supplier", meta: { className: "hidden 2xl:table-cell text-muted-foreground" } },
    {
      accessorKey: "lastRestock",
      header: "Last restock",
      meta: { className: "hidden lg:table-cell text-muted-foreground whitespace-nowrap" },
      cell: ({ getValue }) => timeAgo(getValue() as string),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex justify-end gap-1.5">
            {r.onOrder ? (
              <Button
                size="sm"
                variant="soft"
                onClick={() => {
                  receiveOrder(r.id);
                  toast.success("Delivery received", { description: `${number(r.onOrder!.qty)} × ${r.name} added to stock.` });
                }}
              >
                <PackageCheck aria-hidden /> Receive
              </Button>
            ) : (
              <Button size="sm" variant={r.status === "in-stock" ? "outline" : "primary"} onClick={() => setAction({ type: "reorder", id: r.id })}>
                <PackagePlus aria-hidden /> Reorder
              </Button>
            )}
            <Button size="icon" variant="ghost" className="size-9" aria-label={`Adjust stock for ${r.name}`} onClick={() => setAction({ type: "adjust", id: r.id })}>
              <SlidersHorizontal aria-hidden />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Supplies" title="Inventory" description="Clinical supplies across all stores. Reorder before items run out." />

      {needAction.length > 0 && (
        <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-coral-500/40 bg-coral-50 p-4 sm:flex-row sm:items-center dark:bg-orange-950/40">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-coral-100 text-coral-700 dark:bg-orange-950 dark:text-orange-200">
            <TriangleAlert className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-coral-700 dark:text-orange-200">
              {needAction.length} item{needAction.length === 1 ? "" : "s"} below reorder level
              {out.filter((r) => !r.onOrder).length > 0 && `, ${out.filter((r) => !r.onOrder).length} out of stock`}
            </p>
            <p className="truncate text-sm text-foreground/80">{needAction.map((r) => r.name).join(", ")}</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setStatus(out.some((r) => !r.onOrder) ? "out-of-stock" : "low-stock")}>
            Show them
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Stock value" value={money(value)} icon={CircleDollarSign} tone="brand" hint={`${rows.length} items tracked`} />
        <StatCard label="Low stock" value={low.length} icon={Boxes} tone="coral" hint="At or below reorder level" />
        <StatCard label="Out of stock" value={out.length} icon={PackageX} tone="red" hint="Needs an order now" />
        <StatCard label="On order" value={onOrder.length} icon={Truck} tone="blue" hint={onOrder.length ? `${number(onOrder.reduce((s, r) => s + r.onOrder!.qty, 0))} units coming` : "No open orders"} />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Search item or supplier"
        pageSize={12}
        initialSorting={[{ id: "status", desc: true }]}
        toolbar={
          <>
            <label className="sr-only" htmlFor="i-cat">
              Category
            </label>
            <NativeSelect id="i-cat" value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 w-auto min-w-36 rounded-full">
              <option value="">All categories</option>
              {supplyCategories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </NativeSelect>
            <label className="sr-only" htmlFor="i-loc">
              Location
            </label>
            <NativeSelect id="i-loc" value={location} onChange={(e) => setLocation(e.target.value)} className="h-10 w-auto min-w-36 rounded-full">
              <option value="">All locations</option>
              {supplyLocations.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </NativeSelect>
            <label className="sr-only" htmlFor="i-status">
              Status
            </label>
            <NativeSelect id="i-status" value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 w-auto min-w-32 rounded-full">
              <option value="">Any status</option>
              <option value="in-stock">In stock</option>
              <option value="low-stock">Low stock</option>
              <option value="out-of-stock">Out of stock</option>
            </NativeSelect>
          </>
        }
      />

      <Dialog open={!!current} onOpenChange={(o) => !o && setAction(null)}>
        <DialogContent size="sm">
          {current && action?.type === "reorder" && <ReorderForm item={current} onDone={() => setAction(null)} />}
          {current && action?.type === "adjust" && <AdjustForm item={current} onDone={() => setAction(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReorderForm({ item, onDone }: { item: InventoryRow; onDone: () => void }) {
  const reorder = useAdmin((s) => s.reorder);
  const suggested = Math.max(item.reorderLevel * 3 - item.stock, item.reorderLevel);
  const [qty, setQty] = useState(String(suggested));
  const n = Number(qty);
  const error = !Number.isInteger(n) || n < 1 ? "Enter a whole number above 0" : n > 100_000 ? "That is more than a supplier can send" : undefined;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (error) return;
        const ref = makeRef("PO");
        reorder(item.id, n, ref);
        toast.success("Order placed", { description: `${ref}: ${number(n)} × ${item.name} from ${item.supplier}.` });
        onDone();
      }}
    >
      <DialogTitle>Reorder</DialogTitle>
      <DialogDescription>
        {item.name} · {item.unit}
      </DialogDescription>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-surface-2 p-3">
          <dt className="text-xs text-muted-foreground">In stock</dt>
          <dd className="font-bold tabular-nums">{number(item.stock)}</dd>
        </div>
        <div className="rounded-xl bg-surface-2 p-3">
          <dt className="text-xs text-muted-foreground">Reorder level</dt>
          <dd className="font-bold tabular-nums">{number(item.reorderLevel)}</dd>
        </div>
      </dl>
      <div className="mt-5 space-y-2">
        <Label htmlFor="r-qty">Quantity</Label>
        <Input id="r-qty" type="number" inputMode="numeric" min={1} value={qty} onChange={(e) => setQty(e.target.value)} aria-invalid={!!error} aria-describedby="r-qty-hint" />
        <FieldError message={error} />
        <p id="r-qty-hint" className="text-xs text-muted-foreground">
          Supplier: {item.supplier}. Estimated cost {error ? "–" : formatPrice(Math.round(n * item.unitCost))}.
        </p>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="ghost">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={!!error}>
          <PackagePlus aria-hidden /> Place order
        </Button>
      </DialogFooter>
    </form>
  );
}

function AdjustForm({ item, onDone }: { item: InventoryRow; onDone: () => void }) {
  const adjustStock = useAdmin((s) => s.adjustStock);
  const [qty, setQty] = useState("10");
  const n = Number(qty);
  const error = !Number.isInteger(n) || n < 1 ? "Enter a whole number above 0" : undefined;

  function apply(sign: 1 | -1) {
    if (error) return;
    const delta = sign === -1 ? -Math.min(n, item.stock) : n;
    if (delta === 0) {
      toast.error("Nothing to remove", { description: `${item.name} is already at 0.` });
      return;
    }
    adjustStock(item.id, delta);
    toast.success("Stock updated", { description: `${item.name}: ${number(item.stock)} → ${number(item.stock + delta)}.` });
    onDone();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply(1);
      }}
    >
      <DialogTitle>Adjust stock</DialogTitle>
      <DialogDescription>
        {item.name}. Use this after a stock count, a return or a write-off.
      </DialogDescription>
      <p className="mt-5 text-sm">
        Now in stock: <span className="font-bold tabular-nums">{number(item.stock)}</span> {item.unit}
      </p>
      <div className="mt-4 space-y-2">
        <Label htmlFor="a-qty">Amount</Label>
        <Input id="a-qty" type="number" inputMode="numeric" min={1} value={qty} onChange={(e) => setQty(e.target.value)} aria-invalid={!!error} />
        <FieldError message={error} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => apply(-1)} disabled={!!error}>
          <Minus aria-hidden /> Remove
        </Button>
        <Button type="submit" disabled={!!error}>
          <Plus aria-hidden /> Add
        </Button>
      </DialogFooter>
    </form>
  );
}
