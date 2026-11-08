import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items, inverted }: { items: Crumb[]; inverted?: boolean }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className={cn("flex flex-wrap items-center gap-1 text-sm", inverted ? "text-white/75" : "text-muted-foreground")}>
        {[{ label: "Home", href: "/" }, ...items].map((c, i, all) => (
          <li key={c.label} className="flex items-center gap-1">
            {c.href && i < all.length - 1 ? (
              <Link href={c.href} className={cn("hover:underline", inverted ? "hover:text-white" : "hover:text-foreground")}>
                {c.label}
              </Link>
            ) : (
              <span aria-current="page" className={inverted ? "text-white" : "text-foreground"}>
                {c.label}
              </span>
            )}
            {i < all.length - 1 && <ChevronRight className="size-3.5 opacity-60" aria-hidden />}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Full-bleed image hero used at the top of public pages. */
export function PageHero({
  image,
  imageAlt = "",
  imagePosition,
  eyebrow,
  title,
  description,
  crumbs,
  children,
  tone = "brand",
  align = "left",
}: {
  image: string;
  imageAlt?: string;
  /** CSS object-position, to keep faces in frame when the photo is cropped. */
  imagePosition?: string;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  crumbs: Crumb[];
  children?: React.ReactNode;
  tone?: "brand" | "red";
  align?: "left" | "right";
}) {
  return (
    <section className="container-page pt-6">
      <div className="relative isolate overflow-hidden rounded-3xl bg-brand-950">
        <Image src={image} alt={imageAlt} fill priority sizes="(min-width: 1280px) 1216px, 100vw" className="-z-10 object-cover" style={{ objectPosition: imagePosition }} />
        <div
          className={cn(
            "absolute inset-0 -z-10",
            tone === "red"
              ? "bg-gradient-to-r from-red-950/95 via-red-950/75 to-red-950/20"
              : align === "right"
                ? "bg-gradient-to-l from-brand-950/95 via-brand-950/75 to-brand-950/10"
                : "bg-gradient-to-r from-brand-950/95 via-brand-950/75 to-brand-950/10",
          )}
        />
        <div className={cn("flex items-center lg:min-h-[520px]", align === "right" && "justify-end")}>
          <div className="max-w-2xl px-6 py-14 text-white sm:px-12 sm:py-20">
            <Breadcrumbs items={crumbs} inverted />
            {eyebrow && <div className="mt-6">{eyebrow}</div>}
            <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">{title}</h1>
            {description && <p className="mt-4 text-lg text-white/85">{description}</p>}
            {children && <div className="mt-8">{children}</div>}
          </div>
        </div>
      </div>
    </section>
  );
}
