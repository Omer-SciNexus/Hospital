import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { Breadcrumbs } from "@/components/marketing/page-hero";
import { Checkout } from "@/components/shop/checkout/checkout";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Marketplace", href: "/marketplace" }, { label: "Checkout" }]} />
      <div className="mb-8 mt-4 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Checkout</h1>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Lock className="size-4" aria-hidden /> Secure demo checkout, no real payment
        </p>
      </div>
      <Checkout />
    </div>
  );
}
