import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Check, RotateCcw, ShieldCheck, Stethoscope } from "lucide-react";
import { departmentIcon, departmentsBySlug } from "@/config/departments";
import { categoriesById } from "@/config/marketplace";
import { getProduct, products, relatedProducts } from "@/data/products";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { SectionHeading } from "@/components/ui/section-heading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumbs } from "@/components/marketing/page-hero";
import { ImageBadges, ServiceChips } from "@/components/shop/product-badges";
import { faqsFor, ratingBreakdown, reviewsFor } from "@/components/shop/product-content";
import { ProductImage } from "@/components/shop/product-image";
import { ProductPurchase } from "@/components/shop/product-purchase";
import { ProductRow } from "@/components/shop/product-row";
import { RecentlyViewed, ViewedTracker } from "@/components/shop/recently-viewed";
import { Stars } from "@/components/shop/stars";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getProduct((await params).id);
  return p ? { title: p.name, description: p.description, openGraph: { images: [p.image] } } : {};
}

export default async function ProductPage({ params }: Props) {
  const p = getProduct((await params).id);
  if (!p) notFound();

  const category = categoriesById[p.category];
  const related = relatedProducts(p, 8);
  const reviews = reviewsFor(p);
  const breakdown = ratingBreakdown(p.rating);
  const faqs = faqsFor(p);
  const depts = p.departments.filter((d) => departmentsBySlug[d]).slice(0, 3);

  return (
    <>
      <ViewedTracker id={p.id} />
      <div className="container-page pt-6">
        <Breadcrumbs
          items={[
            { label: "Marketplace", href: "/marketplace" },
            { label: category.name, href: `/marketplace?category=${p.category}#catalog` },
            { label: p.name },
          ]}
        />
      </div>

      <section className="container-page grid gap-8 py-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative overflow-hidden rounded-3xl border border-border shadow-soft">
            <ProductImage product={p} priority sizes="(min-width: 1024px) 600px, 100vw" className="aspect-square" />
            <ImageBadges product={p} className="absolute left-4 top-4" />
          </div>
          <ul className="mt-4 grid grid-cols-3 gap-3 text-center text-xs font-semibold">
            <li className="flex flex-col items-center gap-1 rounded-2xl bg-surface-2 p-3">
              <BadgeCheck className="size-5 text-brand-700 dark:text-brand-300" aria-hidden /> Checked by clinicians
            </li>
            <li className="flex flex-col items-center gap-1 rounded-2xl bg-surface-2 p-3">
              <ShieldCheck className="size-5 text-brand-700 dark:text-brand-300" aria-hidden /> Insurance at checkout
            </li>
            <li className="flex flex-col items-center gap-1 rounded-2xl bg-surface-2 p-3">
              <RotateCcw className="size-5 text-brand-700 dark:text-brand-300" aria-hidden /> 30-day returns
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            {p.brand} · {category.name}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{p.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <a href="#reviews" className="rounded-full hover:opacity-80">
              <Stars rating={p.rating} reviews={p.reviews} size="md" />
            </a>
            <ServiceChips product={p} />
          </div>
          <p className="mt-4 text-muted-foreground">{p.description}</p>
          {depts.length > 0 && (
            <p className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <Stethoscope className="size-4 text-muted-foreground" aria-hidden />
              <span className="text-muted-foreground">Recommended by</span>
              {depts.map((d) => (
                <Link
                  key={d}
                  href={`/departments/${d}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold hover:border-brand-400"
                >
                  <Image src={departmentIcon(d)} alt="" width={16} height={16} className="size-4" />
                  {departmentsBySlug[d].name.replace(/\s*\(.*\)/, "")}
                </Link>
              ))}
            </p>
          )}
          <div className="mt-6 border-t border-border pt-6">
            <ProductPurchase product={p} />
          </div>
        </div>
      </section>

      <section className="container-page py-8">
        <Tabs defaultValue="overview">
          <TabsList aria-label="Product details">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="specs">Specs</TabsTrigger>
            <TabsTrigger value="reviews" id="reviews">Reviews ({p.reviews.toLocaleString("en-US")})</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="rounded-3xl border border-border bg-surface p-6 shadow-soft sm:p-8">
            <h2 className="text-xl font-bold">Why patients choose it</h2>
            <p className="mt-2 max-w-3xl text-muted-foreground">{p.description}</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {p.highlights.map((h) => (
                <li key={h} className="flex items-start gap-3 rounded-2xl bg-surface-2 p-4 text-sm font-medium">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3.5" aria-hidden />
                  </span>
                  {h}
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="specs" className="overflow-hidden rounded-3xl border border-border bg-surface shadow-soft">
            <table className="w-full text-sm">
              <caption className="sr-only">Specifications</caption>
              <tbody>
                {[["Brand", p.brand], ["Category", category.name], ...p.specs, ["Delivery", p.delivery], ["Prescription", p.rx ? "Required" : "Not needed"]].map(([k, v]) => (
                  <tr key={k} className="border-b border-border last:border-b-0 odd:bg-surface-2/50">
                    <th scope="row" className="w-2/5 px-5 py-3.5 text-left font-semibold sm:px-8">{k}</th>
                    <td className="px-5 py-3.5 text-muted-foreground sm:px-8">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>

          <TabsContent value="reviews" className="grid gap-6 lg:grid-cols-[300px_1fr]">
            <div className="rounded-3xl border border-border bg-surface p-6 shadow-soft">
              <p className="font-display text-5xl font-extrabold">{p.rating.toFixed(1)}</p>
              <Stars rating={p.rating} size="md" className="mt-1" />
              <p className="mt-1 text-sm text-muted-foreground">{p.reviews.toLocaleString("en-US")} reviews</p>
              <ul className="mt-5 space-y-2">
                {breakdown.map((pct, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <span className="w-8 shrink-0 tabular-nums">{5 - i}★</span>
                    <Progress value={pct} tone="amber" label={`${5 - i} stars: ${pct}%`} />
                    <span className="w-10 shrink-0 text-right text-muted-foreground tabular-nums">{pct}%</span>
                  </li>
                ))}
              </ul>
            </div>
            <ul className="space-y-4">
              {reviews.map((r) => (
                <li key={r.name + r.title} className="rounded-3xl border border-border bg-surface p-5 shadow-soft">
                  <div className="flex items-center gap-3">
                    <Image src={r.avatar} alt="" width={40} height={40} className="size-10 rounded-full object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{r.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.date}
                        {r.verified && <span className="ml-2 font-semibold text-green-700 dark:text-green-400">Verified purchase</span>}
                      </p>
                    </div>
                    <Stars rating={r.rating} />
                  </div>
                  <h3 className="mt-3 font-bold">{r.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{r.text}</p>
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="faq" className="rounded-3xl border border-border bg-surface px-6 shadow-soft sm:px-8">
            <Accordion type="single" collapsible>
              {faqs.map(([q, a]) => (
                <AccordionItem key={q} value={q}>
                  <AccordionTrigger>{q}</AccordionTrigger>
                  <AccordionContent>{a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>
        </Tabs>
      </section>

      {related.length > 0 && (
        <section className="container-page py-12">
          <SectionHeading eyebrow="You may also need" title="Related products" />
          <ProductRow products={related} className="mt-8" />
        </section>
      )}

      <div className="container-page">
        <RecentlyViewed excludeId={p.id} className="pb-16" />
      </div>
    </>
  );
}
