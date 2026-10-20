"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Heart, LayoutGrid } from "lucide-react";
import { categoryImage, marketplaceCategories } from "@/config/marketplace";
import { productsById } from "@/data/products";
import { cn } from "@/lib/utils";

const chip =
  "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors hover:bg-coral-50 hover:text-coral-700 dark:hover:bg-orange-950 dark:hover:text-orange-200";
const activeChip = "bg-coral-50 text-coral-700 ring-1 ring-coral-500/40 dark:bg-orange-950 dark:text-orange-200";

/** Category bar under the header. Plain list; `active` highlights one chip. */
export function CategoryNavList({ active }: { active: string | null }) {
  return (
    <nav aria-label="Marketplace categories" className="border-b border-border bg-surface">
      <ul className="container-page scrollbar-none flex gap-1 overflow-x-auto py-2">
        <li className="shrink-0">
          <Link href="/marketplace#catalog" className={cn(chip, active === "" && activeChip)} aria-current={active === "" ? "page" : undefined}>
            <LayoutGrid className="size-4" aria-hidden /> All
          </Link>
        </li>
        {marketplaceCategories.map((c) => (
          <li key={c.id} className="shrink-0">
            <Link
              href={`/marketplace?category=${c.id}#catalog`}
              aria-current={active === c.id ? "page" : undefined}
              className={cn(chip, active === c.id && activeChip)}
            >
              <Image src={categoryImage(c.id)} alt="" width={22} height={22} className="size-5.5" />
              {c.name}
            </Link>
          </li>
        ))}
        <li className="ml-auto shrink-0 border-l border-border pl-1">
          <Link href="/marketplace/wishlist" className={cn(chip, active === "wishlist" && activeChip)} aria-current={active === "wishlist" ? "page" : undefined}>
            <Heart className="size-4" aria-hidden /> Wishlist
          </Link>
        </li>
      </ul>
    </nav>
  );
}

/** Reads the current category (catalog filter or product page) and highlights it. */
export function CategoryNav() {
  const pathname = usePathname();
  const params = useSearchParams();
  let active: string | null = null;
  if (pathname === "/marketplace") active = params.get("category") ?? "";
  else if (pathname === "/marketplace/wishlist") active = "wishlist";
  else {
    const id = pathname.match(/^\/marketplace\/([^/]+)$/)?.[1];
    if (id && productsById[id]) active = productsById[id].category;
  }
  return <CategoryNavList active={active} />;
}
