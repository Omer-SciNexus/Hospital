"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, FileCheck2, House, PackageCheck, ShieldCheck, Truck, Video } from "lucide-react";
import { insurersById } from "@/data/insurers";
import { useHydrated } from "@/lib/use-hydrated";
import { formatPrice } from "@/lib/utils";
import { useOrders } from "@/store/orders";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/dashboard/empty-state";
import { isPhysical } from "../shop-utils";

/** Thank-you screen after checkout. Reads the order from the orders store. Wrap in <Suspense>. */
export function CheckoutSuccess() {
  const hydrated = useHydrated();
  const id = useSearchParams().get("order");
  const orders = useOrders((s) => s.orders);
  const order = id ? orders.find((o) => o.id === id) : undefined;

  if (!hydrated) return <Skeleton className="mx-auto h-[520px] max-w-2xl rounded-3xl" />;
  if (!order) {
    return (
      <EmptyState
        image="/images/dashboard/empty-orders.png"
        title="We could not find that order"
        description="It may have been placed on another device. Your orders are always listed in your dashboard."
        action={
          <Button asChild>
            <Link href="/dashboard/orders">My orders</Link>
          </Button>
        }
      />
    );
  }

  const insurer = order.insurerId ? insurersById[order.insurerId] : undefined;
  const hasGoods = order.lines.some(isPhysical);
  const hasVideo = order.lines.some((l) => l.category === "consultations");
  const steps = [
    order.rx && {
      icon: FileCheck2,
      title: "Pharmacist checks your prescription",
      text: order.rx.fileName.startsWith("E-prescription") ? "We pull it from your hospital record, usually within an hour." : "Usually within an hour. We message you if anything is unclear.",
    },
    order.lab && { icon: House, title: "Home sample collection", text: `${order.slot?.split(" · Video")[0].replace("Home collection: ", "") ?? "At your chosen time"}. Sample ID ${order.lab.sampleId}.` },
    hasVideo && { icon: Video, title: "Video visit", text: "Your join link appears in your patient portal 15 minutes before the visit." },
    hasGoods && { icon: Truck, title: "Delivery", text: `To ${order.address}. We text you when the driver is on the way.` },
    insurer && order.insurancePays > 0 && { icon: ShieldCheck, title: "Insurance claim sent", text: `${insurer.name} is asked to pay ${formatPrice(order.insurancePays)}. Track it under Insurance.` },
  ].filter(Boolean) as { icon: typeof Truck; title: string; text: string }[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="mx-auto max-w-2xl rounded-3xl border border-border bg-surface p-6 text-center shadow-lift sm:p-10"
    >
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15, type: "spring", bounce: 0.4 }}>
        <Image src="/images/dashboard/success-order.png" alt="" width={200} height={200} priority className="mx-auto size-40" />
      </motion.div>
      <h1 className="mt-4 text-3xl font-extrabold">Thank you, your order is in</h1>
      <p className="mt-2 text-muted-foreground">
        Order number <span className="font-mono font-bold text-foreground">{order.id}</span>
      </p>

      <dl className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-2 rounded-2xl bg-surface-2 p-4 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Total</dt>
          <dd className="font-semibold tabular-nums">{formatPrice(order.subtotal + order.deliveryFee)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Insurance</dt>
          <dd className="font-semibold text-green-700 tabular-nums dark:text-green-400">−{formatPrice(order.insurancePays)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">You pay</dt>
          <dd className="font-display text-lg font-extrabold tabular-nums">{formatPrice(order.total)}</dd>
        </div>
      </dl>

      <h2 className="mt-8 text-left text-lg font-bold">What happens next</h2>
      <ol className="mt-3 space-y-3 text-left">
        {steps.map((s, i) => (
          <motion.li
            key={s.title}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className="flex gap-3 rounded-2xl border border-border p-4"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200">
              <s.icon className="size-5" aria-hidden />
            </span>
            <span>
              <span className="block font-semibold">{s.title}</span>
              <span className="block text-sm text-muted-foreground">{s.text}</span>
            </span>
          </motion.li>
        ))}
        {steps.length === 0 && (
          <li className="flex gap-3 rounded-2xl border border-border p-4">
            <PackageCheck className="size-5 text-primary" aria-hidden /> We are preparing your order.
          </li>
        )}
      </ol>

      <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/dashboard/orders">
            Track my order <ArrowRight aria-hidden />
          </Link>
        </Button>
        {insurer && (
          <Button asChild size="lg" variant="outline">
            <Link href="/dashboard/insurance">See my claim</Link>
          </Button>
        )}
        <Button asChild size="lg" variant="ghost">
          <Link href="/marketplace">Keep shopping</Link>
        </Button>
      </div>
    </motion.div>
  );
}
