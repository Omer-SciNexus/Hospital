import type { MetadataRoute } from "next";
import { departments } from "@/config/departments";
import { blogPosts } from "@/data/content";
import { doctors } from "@/data/doctors";
import { products } from "@/data/products";

/** Placeholder domain for the demo; set NEXT_PUBLIC_SITE_URL when deploying. */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aurelia-hospital.example";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/departments", "/doctors", "/services", "/marketplace", "/insurance", "/emergency", "/about", "/blog", "/contact"];
  return [
    ...pages.map((p) => ({ url: `${siteUrl}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.8 })),
    ...departments.map((d) => ({ url: `${siteUrl}/departments/${d.slug}`, priority: 0.7 })),
    ...doctors.map((d) => ({ url: `${siteUrl}/doctors/${d.id}`, priority: 0.6 })),
    ...products.map((p) => ({ url: `${siteUrl}/marketplace/${p.id}`, priority: 0.6 })),
    ...blogPosts.map((b) => ({ url: `${siteUrl}/blog/${b.slug}`, priority: 0.5 })),
  ];
}
