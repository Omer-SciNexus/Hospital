import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/marketing/page-hero";
import { CompareView } from "@/components/shop/compare-view";

export const metadata: Metadata = { title: "Compare products" };

export default function ComparePage() {
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Marketplace", href: "/marketplace" }, { label: "Compare" }]} />
      <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">Compare products</h1>
      <p className="mt-2 text-muted-foreground">Price, insurance, prescription and specs, side by side.</p>
      <div className="mt-8">
        <CompareView />
      </div>
    </div>
  );
}
