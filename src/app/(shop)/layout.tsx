import { Suspense } from "react";
import { BadgePercent, ShieldCheck, Truck } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CartDrawer } from "@/components/shop/cart-drawer";
import { CategoryNav, CategoryNavList } from "@/components/shop/category-nav";
import { CompareTray } from "@/components/shop/compare-tray";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="bg-gradient-to-r from-coral-700 via-coral-700 to-rose-700 text-white">
        <div className="container-page flex h-10 items-center justify-center gap-6 text-xs font-semibold sm:justify-between">
          <span className="flex items-center gap-1.5">
            <BadgePercent className="size-4" aria-hidden /> Flash sale: 20% off devices this week
          </span>
          <span className="hidden items-center gap-5 sm:flex">
            <span className="flex items-center gap-1.5"><Truck className="size-4" aria-hidden /> Free delivery over $50</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="size-4" aria-hidden /> Insurance applied at checkout</span>
          </span>
        </div>
      </div>
      <SiteHeader />
      <Suspense fallback={<CategoryNavList active={null} />}>
        <CategoryNav />
      </Suspense>
      <main id="main" className="pb-24">{children}</main>
      <SiteFooter />
      <CartDrawer />
      <CompareTray />
    </>
  );
}
