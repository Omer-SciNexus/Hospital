import type { MetadataRoute } from "next";
import { siteUrl } from "./sitemap";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/marketplace/checkout"] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
