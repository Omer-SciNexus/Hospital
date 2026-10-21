import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { departmentIcon, departmentsBySlug } from "@/config/departments";
import { categoryImage, marketplaceCategories } from "@/config/marketplace";
import { site } from "@/config/site";
import { products } from "@/data/products";
import { healthPackages } from "@/data/services";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { PackageCard } from "@/components/marketing/package-card";
import { Catalog } from "@/components/shop/catalog";
import { FlashSale } from "@/components/shop/flash-sale";
import { HeroCarousel } from "@/components/shop/hero-carousel";
import { ProductRow } from "@/components/shop/product-row";
import { RecentlyViewed } from "@/components/shop/recently-viewed";

export const metadata: Metadata = {
  title: "Marketplace",
  description: "Lab tests, health packages, pharmacy, devices, mobility rentals and video visits, with insurance applied at checkout.",
};

const deals = products.filter((p) => p.oldPrice).sort((a, b) => b.oldPrice! - b.price - (a.oldPrice! - a.price));
const bestSellers = products
  .filter((p) => p.tags?.includes("bestseller"))
  .sort((a, b) => b.reviews - a.reviews)
  .slice(0, 8);

const featuredDepartments = [
  "cardiology",
  "endocrinology",
  "pediatrics",
  "pulmonology",
  "orthopedics",
  "obstetrics-gynecology",
  "dermatology",
  "neurology",
  "nutrition",
  "internal-medicine",
  "psychiatry",
  "emergency",
].filter((slug) => departmentsBySlug[slug] && products.some((p) => p.departments.includes(slug)));

const insuranceSteps = [
  { icon: "card", title: "Add your card", text: "Save your insurance card once. Our billing team checks it, usually the same day." },
  { icon: "coverage", title: "See your share", text: "Every item shows what your plan pays and what you pay, before you pay." },
  { icon: "in-network", title: "In-network pricing", text: "We work with 10 insurers, so most plans get our in-network prices." },
  { icon: "claim", title: "We send the claim", text: "No paperwork for you. We file the claim and you track it in your portal." },
];

export default function MarketplacePage() {
  return (
    <>
      <h1 className="sr-only">{site.name} Marketplace</h1>

      <section className="container-page pt-6">
        <HeroCarousel />
      </section>

      {/* Categories */}
      <section aria-labelledby="cat-title" className="container-page py-14">
        <SectionHeading eyebrow="Shop by category" title={<span id="cat-title">Ten aisles, one checkout</span>} />
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {marketplaceCategories.map((c, i) => (
            <Reveal as="li" key={c.id} delay={i * 0.03}>
              <Link
                href={`/marketplace?category=${c.id}#catalog`}
                className="group flex h-full flex-col items-center rounded-2xl border border-border bg-surface p-4 text-center shadow-soft transition-all hover:-translate-y-1 hover:border-coral-500/40 hover:shadow-lift sm:p-5"
              >
                <Image src={categoryImage(c.id)} alt="" width={112} height={112} className="size-20 transition-transform duration-500 group-hover:-rotate-3 group-hover:scale-110 sm:size-24" />
                <span className="mt-3 font-display font-bold">{c.name}</span>
                <span className="mt-1 text-xs text-muted-foreground">{c.blurb}</span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>

      <div className="container-page">
        <FlashSale products={deals} />
      </div>

      {/* Shop by department */}
      <section aria-labelledby="dept-title" className="container-page py-14">
        <SectionHeading
          eyebrow="Shop by department"
          title={<span id="dept-title">Picked by our specialists</span>}
          description="Products and services each department recommends for its patients."
        />
        <ul className="scrollbar-none -mx-4 mt-8 flex gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-6 lg:overflow-visible lg:px-0">
          {featuredDepartments.map((slug) => {
            const d = departmentsBySlug[slug];
            return (
              <li key={slug} className="w-32 shrink-0 lg:w-auto">
                <Link
                  href={`/marketplace?department=${slug}#catalog`}
                  className="group flex h-full flex-col items-center rounded-2xl border border-border bg-surface p-4 text-center shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift"
                >
                  <Image src={departmentIcon(slug)} alt="" width={64} height={64} className="size-14 transition-transform duration-500 group-hover:scale-110" />
                  <span className="mt-2 text-sm font-semibold leading-tight">{d.name.replace(/\s*\(.*\)/, "")}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Best sellers */}
      <section aria-labelledby="best-title" className="container-page pb-14">
        <SectionHeading
          eyebrow="Loved by patients"
          title={<span id="best-title">Best sellers</span>}
          action={
            <Button asChild variant="outline">
              <Link href="/marketplace?sort=popular#catalog">
                See all <ArrowRight aria-hidden />
              </Link>
            </Button>
          }
        />
        <ProductRow products={bestSellers} grid className="mt-8" />
      </section>

      {/* Health packages */}
      <section aria-labelledby="pkg-title" className="bg-surface-2 py-14">
        <div className="container-page">
          <SectionHeading
            eyebrow="Health packages"
            title={<span id="pkg-title">Check-ups at bundle prices</span>}
            description="Home sample collection or a hospital visit, with a doctor review of every result."
          />
          <ul className="scrollbar-none -mx-4 mt-8 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
            {healthPackages.map((p) => (
              <li key={p.id} className="w-[280px] shrink-0 snap-start lg:w-auto">
                <PackageCard pkg={p} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Insurance explainer */}
      <section aria-labelledby="ins-title" className="container-page py-14">
        <div className="rounded-3xl border border-border bg-surface p-6 shadow-soft sm:p-10">
          <SectionHeading
            eyebrow="Insurance applied at checkout"
            title={<span id="ins-title">Your plan pays its part, automatically</span>}
            description="No forms, no waiting for a refund. You only pay your share."
            action={
              <Button asChild variant="soft">
                <Link href="/insurance">
                  How insurance works <ArrowRight aria-hidden />
                </Link>
              </Button>
            }
          />
          <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {insuranceSteps.map((s, i) => (
              <Reveal as="li" key={s.icon} delay={i * 0.06} className="relative rounded-2xl bg-surface-2 p-5">
                <span className="absolute right-4 top-4 font-display text-3xl font-extrabold text-muted-foreground/25" aria-hidden>
                  {i + 1}
                </span>
                <Image src={`/images/icons/insurance/${s.icon}.png`} alt="" width={64} height={64} className="size-14" />
                <h3 className="mt-3 font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <div className="container-page">
        <RecentlyViewed className="pb-14" />
      </div>

      {/* Catalog */}
      <section id="catalog" aria-labelledby="catalog-title" className="container-page scroll-mt-32 pb-16">
        <SectionHeading eyebrow="Full catalog" title={<span id="catalog-title">Everything in the store</span>} className="mb-8" />
        <Suspense fallback={<CatalogSkeleton />}>
          <Catalog />
        </Suspense>
      </section>
    </>
  );
}

function CatalogSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[264px_1fr]">
      <Skeleton className="hidden h-[560px] rounded-3xl lg:block" />
      <div>
        <Skeleton className="h-11 rounded-full" />
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-3xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
