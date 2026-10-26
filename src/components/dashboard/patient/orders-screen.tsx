"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, FlaskConical, MapPin, Pill, RotateCcw, ShoppingBag, Truck, X } from "lucide-react";
import { insurersById } from "@/data/insurers";
import { productsById } from "@/data/products";
import { useCart } from "@/store/cart";
import { RX_UPLOAD_ID, type Order } from "@/store/orders";
import { formatDay, formatTime } from "@/lib/dates";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { useMyOrders } from "./use-patient";

type Filter = "all" | "active" | "delivered" | "cancelled";

const filters: { id: Filter; label: string; test: (o: Order) => boolean }[] = [
  { id: "all", label: "All", test: () => true },
  { id: "active", label: "In progress", test: (o) => !["delivered", "cancelled"].includes(o.status) },
  { id: "delivered", label: "Delivered", test: (o) => o.status === "delivered" },
  { id: "cancelled", label: "Cancelled", test: (o) => o.status === "cancelled" },
];

/** Steps for the progress tracker. Lab orders use lab wording; Rx orders get an extra pharmacist step. */
export function orderSteps(o: Order) {
  if (o.lab) {
    const labels = ["Booked", "Sample taken", "In the lab", "Results ready"];
    const index = { scheduled: 0, collected: 1, processing: 2, resulted: 3 }[o.lab.status];
    return { labels, index };
  }
  const labels = [...(o.rx ? ["Rx check"] : []), "Placed", "Processing", "Shipped", "Delivered"];
  const offset = o.rx ? 1 : 0;
  const index =
    o.status === "rx-review" ? 0 : o.status === "cancelled" ? -1 : offset + ["placed", "processing", "shipped", "delivered"].indexOf(o.status);
  return { labels, index };
}

/** Patient orders from the marketplace, with tracking, Rx and lab status, and "buy again". */
export function OrdersScreen() {
  const orders = useMyOrders();
  const [filter, setFilter] = useState<Filter>("all");
  const [tracking, setTracking] = useState<Order | null>(null);
  const shown = useMemo(() => orders.filter(filters.find((f) => f.id === filter)!.test), [orders, filter]);

  return (
    <div>
      <PageHeader
        eyebrow="Marketplace"
        title="My orders"
        description="Track deliveries, home lab visits and prescription checks."
        actions={
          <Button asChild>
            <Link href="/marketplace">
              <ShoppingBag aria-hidden /> Shop marketplace
            </Link>
          </Button>
        }
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList aria-label="Filter orders">
          {filters.map((f) => (
            <TabsTrigger key={f.id} value={f.id}>
              {f.label}
              <span className="rounded-full bg-background px-1.5 text-xs tabular-nums">{orders.filter(f.test).length}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-6">
        {shown.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface shadow-soft">
            <EmptyState
              image="/images/dashboard/empty-orders.png"
              title={filter === "all" ? "No orders yet" : "Nothing here"}
              description={filter === "all" ? "Medicines, devices and lab tests you order will show up here." : "No orders match this filter."}
              action={
                <Button asChild>
                  <Link href="/marketplace">Browse the marketplace</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <ul className="grid gap-4">
            {shown.map((o) => (
              <OrderCard key={o.id} order={o} onTrack={() => setTracking(o)} />
            ))}
          </ul>
        )}
      </div>

      <TrackDialog order={tracking} onClose={() => setTracking(null)} />
    </div>
  );
}

function useBuyAgain() {
  const add = useCart((s) => s.add);
  const setOpen = useCart((s) => s.setOpen);
  const router = useRouter();
  return (o: Order) => {
    for (const l of o.lines) {
      if (l.productId === RX_UPLOAD_ID) continue;
      const product = productsById[l.productId];
      add(
        {
          id: l.mode === "rent" ? `${l.productId}:rent` : l.productId,
          productId: l.productId,
          name: l.name,
          image: l.image,
          price: product?.price ?? l.price,
          mode: l.mode,
          rx: l.rx,
          category: l.category,
          coverage: product?.coverage ?? l.coverage,
        },
        l.quantity,
      );
    }
    toast.success(`${o.lines.length === 1 ? "Item" : `${o.lines.length} items`} added to your cart`, {
      description: o.rx ? "You will need a valid prescription again at checkout." : undefined,
      action: {
        label: "View cart",
        onClick: () => {
          setOpen(true);
          router.push("/marketplace");
        },
      },
    });
  };
}

function OrderCard({ order: o, onTrack }: { order: Order; onTrack: () => void }) {
  const buyAgain = useBuyAgain();
  const insurer = o.insurerId ? insurersById[o.insurerId] : undefined;

  return (
    <li className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-surface-2/60 px-5 py-3 text-sm">
        <p className="font-bold">{o.id}</p>
        <p className="text-muted-foreground">{formatDate(o.createdAt)}</p>
        {o.lab && (
          <Badge variant="blue">
            <FlaskConical aria-hidden /> Lab test
          </Badge>
        )}
        {o.rx && (
          <Badge variant="coral">
            <Pill aria-hidden /> Prescription
          </Badge>
        )}
        <span className="ml-auto">
          <StatusBadge status={o.status} />
        </span>
      </div>

      <div className="space-y-5 p-5">
        <Tracker order={o} />

        <ul className="space-y-3">
          {o.lines.map((l) => (
            <li key={l.productId + (l.mode ?? "")} className="flex items-center gap-3">
              <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                <Image src={l.image} alt="" fill sizes="96px" className="object-cover" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{l.name}</p>
                <p className="text-xs text-muted-foreground">
                  Qty {l.quantity}
                  {l.mode === "rent" && " · rental"}
                  {l.coverage > 0 && ` · insurance pays ${l.coverage}%`}
                </p>
              </div>
              <p className="text-sm font-semibold tabular-nums">{formatPrice(l.price * l.quantity)}</p>
            </li>
          ))}
        </ul>

        {o.lab?.status === "resulted" && (
          <div className="flex items-start gap-3 rounded-xl bg-green-50 p-3 text-sm text-green-900 dark:bg-green-950 dark:text-green-100">
            <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>
              <span className="font-semibold">Results ready.</span> {o.lab.resultNote}{" "}
              <Link href="/dashboard/records" className="font-semibold underline underline-offset-2">
                See results
              </Link>
            </p>
          </div>
        )}
        {o.rx && (
          <div
            className={cn(
              "flex items-start gap-3 rounded-xl p-3 text-sm",
              o.rx.status === "approved" && "bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100",
              o.rx.status === "pending" && "bg-coral-50 text-coral-700 dark:bg-orange-950 dark:text-orange-100",
              o.rx.status === "rejected" && "bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100",
            )}
          >
            <Pill className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>
              <span className="font-semibold">
                Prescription {o.rx.status === "pending" ? "being checked by our pharmacist" : o.rx.status}.
              </span>{" "}
              {o.rx.note ?? (o.rx.status === "pending" ? "Usually takes under 2 hours." : `File: ${o.rx.fileName}`)}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-end sm:justify-between">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(o.subtotal)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Delivery</dt>
              <dd className="tabular-nums">{o.deliveryFee ? formatPrice(o.deliveryFee) : "Free"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{insurer ? `${insurer.name} pays` : "Insurance pays"}</dt>
              <dd className="tabular-nums text-green-700 dark:text-green-300">−{formatPrice(o.insurancePays)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">You paid</dt>
              <dd className="font-bold tabular-nums">{formatPrice(o.total)}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="soft" onClick={onTrack}>
              <Truck aria-hidden /> Track
            </Button>
            {o.lines.some((l) => l.productId !== RX_UPLOAD_ID) && (
              <Button size="sm" variant="outline" onClick={() => buyAgain(o)}>
                <RotateCcw aria-hidden /> Buy again
              </Button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function Tracker({ order }: { order: Order }) {
  const { labels, index } = orderSteps(order);
  if (order.status === "cancelled") {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
        <X className="size-4" aria-hidden /> This order was cancelled. You have not been charged.
      </p>
    );
  }
  return (
    <ol className="grid gap-2" style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }} aria-label="Order progress">
      {labels.map((label, i) => {
        const done = i < index || (i === index && i === labels.length - 1);
        const current = i === index && !done;
        return (
          <li key={label} aria-current={current ? "step" : undefined} className="min-w-0">
            <span className={cn("block h-1.5 rounded-full", done ? "bg-primary" : current ? "bg-brand-300 dark:bg-brand-700" : "bg-muted")} />
            <span
              className={cn(
                "mt-1.5 flex items-center gap-1 text-[11px] font-semibold sm:text-xs",
                done || current ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {done && <Check className="hidden size-3 shrink-0 text-primary sm:block" aria-hidden />}
              <span className="truncate">{label}</span>
              <span className="sr-only">{done ? " (done)" : current ? " (now)" : ""}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function TrackDialog({ order, onClose }: { order: Order | null; onClose: () => void }) {
  return (
    <Dialog open={!!order} onOpenChange={(o) => !o && onClose()}>
      {order && (
        <DialogContent>
          <DialogTitle>Track order {order.id}</DialogTitle>
          <DialogDescription>
            Placed {formatDay(order.createdAt)} at {formatTime(order.createdAt)}
          </DialogDescription>
          <Timeline order={order} />
          <dl className="mt-6 grid gap-3 rounded-2xl bg-surface-2 p-4 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <div>
                <dt className="text-xs text-muted-foreground">{order.lab ? "Sample collection at" : "Delivery address"}</dt>
                <dd className="font-semibold">{order.address}</dd>
              </div>
            </div>
            {order.slot && (
              <div className="flex items-start gap-2">
                <Truck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <div>
                  <dt className="text-xs text-muted-foreground">Time slot</dt>
                  <dd className="font-semibold">{order.slot}</dd>
                </div>
              </div>
            )}
            {order.lab && (
              <p className="text-xs text-muted-foreground">
                Sample ID <span className="font-mono">{order.lab.sampleId}</span>
              </p>
            )}
            {order.claimId && (
              <p className="text-xs text-muted-foreground">
                Insurance claim <span className="font-mono">{order.claimId}</span>
              </p>
            )}
          </dl>
          <DialogFooter>
            <Button variant="outline" onClick={() => toast.success("Courier contacted", { description: "They will call you before arriving." })}>
              Contact courier
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

function Timeline({ order }: { order: Order }) {
  const { labels, index } = orderSteps(order);
  const base = new Date(order.createdAt).getTime();
  const cancelled = order.status === "cancelled";
  return (
    <ol className="mt-6 space-y-0">
      {labels.map((label, i) => {
        const done = !cancelled && i <= index;
        const at = new Date(Math.min(base + i * 9 * 60 * 60_000, Date.now())).toISOString();
        return (
          <li key={label} className="relative flex gap-4 pb-5 last:pb-0">
            {i < labels.length - 1 && <span className={cn("absolute left-[11px] top-6 h-full w-0.5", done && i < index ? "bg-primary" : "bg-border")} aria-hidden />}
            <span
              className={cn(
                "relative z-10 grid size-6 shrink-0 place-items-center rounded-full border-2",
                done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface",
              )}
            >
              {done && <Check className="size-3" strokeWidth={3} aria-hidden />}
            </span>
            <div className="-mt-0.5">
              <p className={cn("text-sm font-semibold", !done && "text-muted-foreground")}>{label}</p>
              <p className="text-xs text-muted-foreground">{done ? `${formatDay(at)}, ${formatTime(at)}` : "Waiting"}</p>
            </div>
          </li>
        );
      })}
      {cancelled && (
        <li className="mt-2 flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-300">
          <X className="size-4" aria-hidden /> Order cancelled{order.rx?.note ? `: ${order.rx.note}` : ""}
        </li>
      )}
    </ol>
  );
}
