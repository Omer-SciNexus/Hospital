import Image from "next/image";
import { Check, Clock, FlaskConical } from "lucide-react";
import type { HealthPackage } from "@/data/services";
import { productsById } from "@/data/products";
import { formatPrice } from "@/lib/utils";
import { AddToCartButton } from "./add-to-cart-button";

export function PackageCard({ pkg }: { pkg: HealthPackage }) {
  const saving = pkg.oldPrice ? Math.round((1 - pkg.price / pkg.oldPrice) * 100) : 0;
  return (
    <article className="relative flex h-full flex-col rounded-3xl border border-border bg-surface p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      {pkg.popular && (
        <span className="absolute right-5 top-5 rounded-full bg-coral-700 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          Popular
        </span>
      )}
      <Image src={pkg.image} alt="" width={96} height={96} className="size-20" />
      <h3 className="mt-4 font-display text-xl font-bold">{pkg.name}</h3>
      <p className="text-sm text-muted-foreground">{pkg.audience}</p>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-muted-foreground">
        <span className="flex items-center gap-1"><FlaskConical className="size-3.5" aria-hidden /> {pkg.tests} tests</span>
        <span className="flex items-center gap-1"><Clock className="size-3.5" aria-hidden /> {pkg.turnaround}</span>
      </div>
      <ul className="mt-5 space-y-2 text-sm">
        {pkg.includes.slice(0, 4).map((item) => (
          <li key={item} className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden /> {item}
          </li>
        ))}
      </ul>
      <div className="mt-auto flex items-end justify-between gap-3 pt-6">
        <div>
          {pkg.oldPrice && (
            <p className="text-sm text-muted-foreground">
              <s>{formatPrice(pkg.oldPrice)}</s> <span className="font-semibold text-green-700 dark:text-green-400">Save {saving}%</span>
            </p>
          )}
          <p className="font-display text-2xl font-extrabold">{formatPrice(pkg.price)}</p>
        </div>
        <AddToCartButton
          label="Book now"
          aria-label={`Book ${pkg.name}`}
          item={{
            id: `pkg-${pkg.id}`,
            productId: `pkg-${pkg.id}`,
            name: pkg.name,
            image: pkg.image,
            price: pkg.price,
            mode: "buy",
            category: "health-packages",
            coverage: productsById[`pkg-${pkg.id}`]?.coverage ?? 60,
          }}
        />
      </div>
    </article>
  );
}
