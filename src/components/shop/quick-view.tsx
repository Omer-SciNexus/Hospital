"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { categoriesById } from "@/config/marketplace";
import type { Product } from "@/data/products";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ImageBadges, ServiceChips } from "./product-badges";
import { ProductImage } from "./product-image";
import { ProductPurchase } from "./product-purchase";
import { maxCoverage } from "./shop-utils";
import { Stars } from "./stars";

const item = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.05 + i * 0.05, duration: 0.3, ease: [0.2, 0.8, 0.2, 1] as const } }),
};

/** Quick look at a product without leaving the catalog. */
export function QuickView({ product: p, open, onOpenChange }: { product: Product; open: boolean; onOpenChange: (open: boolean) => void }) {
  const cover = maxCoverage(p);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="p-0 sm:p-0">
        <div className="grid md:grid-cols-[0.9fr_1fr]">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }} className="relative">
            <ProductImage product={p} sizes="(min-width: 768px) 400px, 90vw" className="aspect-square md:h-full md:rounded-l-3xl" />
            <ImageBadges product={p} className="absolute left-4 top-4" />
          </motion.div>
          <div className="p-6 sm:p-8">
            <motion.p variants={item} initial="hidden" animate="show" custom={0} className="text-xs font-bold uppercase tracking-wider text-primary">
              {p.brand} · {categoriesById[p.category].name}
            </motion.p>
            <motion.div variants={item} initial="hidden" animate="show" custom={1}>
              <DialogTitle className="mt-2 text-2xl">{p.name}</DialogTitle>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <Stars rating={p.rating} reviews={p.reviews} />
                <ServiceChips product={p} />
              </div>
              <DialogDescription className="mt-3 line-clamp-3">{p.description}</DialogDescription>
            </motion.div>
            <motion.ul variants={item} initial="hidden" animate="show" custom={2} className="mt-4 grid gap-1.5 text-sm">
              {p.highlights.slice(0, 3).map((h) => (
                <li key={h} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-brand-600 dark:text-brand-300" aria-hidden /> {h}
                </li>
              ))}
              {cover > 0 && (
                <li className="mt-1 text-sm font-semibold text-green-700 dark:text-green-400">Insurance may pay up to {cover}%</li>
              )}
            </motion.ul>
            <motion.div variants={item} initial="hidden" animate="show" custom={3} className="mt-6">
              <ProductPurchase product={p} variant="quick" onDone={() => onOpenChange(false)} />
            </motion.div>
            <Link
              href={`/marketplace/${p.id}`}
              onClick={() => onOpenChange(false)}
              className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
            >
              See full details <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
