import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/marketing/page-hero";
import { WishlistView } from "@/components/shop/wishlist-view";

export const metadata: Metadata = { title: "Wishlist" };

export default function WishlistPage() {
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Marketplace", href: "/marketplace" }, { label: "Wishlist" }]} />
      <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">Your wishlist</h1>
      <p className="mt-2 text-muted-foreground">Things you saved for later. They stay here on this device.</p>
      <div className="mt-8">
        <WishlistView />
      </div>
    </div>
  );
}
