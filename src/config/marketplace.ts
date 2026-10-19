import type { MarketplaceCategoryId } from "./departments";

export const marketplaceCategories: { id: MarketplaceCategoryId; name: string; blurb: string }[] = [
  { id: "lab-tests", name: "Lab tests", blurb: "Home collection, results in 24h" },
  { id: "health-packages", name: "Health packages", blurb: "Full check-ups at bundle prices" },
  { id: "pharmacy", name: "Pharmacy", blurb: "Upload Rx, same-day delivery" },
  { id: "medical-devices", name: "Medical devices", blurb: "Monitors, meters and more" },
  { id: "mobility", name: "Mobility", blurb: "Rent or buy, weekly plans" },
  { id: "consultations", name: "Consultations", blurb: "Video visits with specialists" },
  { id: "wellness", name: "Wellness", blurb: "Vitamins, fitness and sleep" },
  { id: "mother-baby", name: "Mother & baby", blurb: "Care for the newest family" },
  { id: "personal-care", name: "Personal care", blurb: "Dermatologist-picked skincare" },
  { id: "first-aid", name: "First aid", blurb: "Kits and supplies for home" },
];

export const categoryImage = (id: string) => `/images/marketplace/categories/${id}.png`;

export const categoriesById = Object.fromEntries(marketplaceCategories.map((c) => [c.id, c])) as Record<
  MarketplaceCategoryId,
  (typeof marketplaceCategories)[number]
>;
