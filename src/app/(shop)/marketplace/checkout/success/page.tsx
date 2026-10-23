import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckoutSuccess } from "@/components/shop/checkout/success";

export const metadata: Metadata = { title: "Order placed", robots: { index: false } };

export default function CheckoutSuccessPage() {
  return (
    <div className="container-page py-10">
      <Suspense fallback={<Skeleton className="mx-auto h-[520px] max-w-2xl rounded-3xl" />}>
        <CheckoutSuccess />
      </Suspense>
    </div>
  );
}
