/** Hospital identity. Made-up name and contact details for the demo; rename here only. */
export const site = {
  name: "Aurelia Hospital",
  shortName: "Aurelia",
  tagline: "Modern care, close to home",
  description:
    "A modern multi-specialty hospital with 29 departments, online booking, a health marketplace and care that follows you home.",
  phone: "+1 (555) 014-2200",
  emergencyPhone: "+1 (555) 014-0911",
  emergencyShort: "911",
  crisisLine: "988",
  email: "care@aurelia-hospital.example",
  address: {
    line1: "2400 Riverside Avenue",
    city: "Lakeview",
    region: "CA",
    postal: "90210",
  },
  hours: {
    outpatient: "Mon–Sat, 7:00–20:00",
    visiting: "Daily, 10:00–20:00",
    emergency: "24/7, every day",
  },
  stats: [
    { label: "Departments", value: 29 },
    { label: "Specialists", value: 340, suffix: "+" },
    { label: "Beds", value: 620 },
    { label: "Patient rating", value: 4.9, suffix: "/5", decimals: 1 },
  ],
  social: [
    { label: "Facebook", href: "#" },
    { label: "Instagram", href: "#" },
    { label: "LinkedIn", href: "#" },
    { label: "YouTube", href: "#" },
  ],
} as const;

export type Site = typeof site;
