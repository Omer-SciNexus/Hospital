/** Made-up insurance companies. "Logos" are colored initials rendered in HTML. */

export interface Insurer {
  id: string;
  name: string;
  initials: string;
  color: string;
  plans: string[];
  /** Typical share insurance pays for in-network outpatient care. */
  coverage: number;
  network: "in-network" | "partial";
}

export const insurers: Insurer[] = [
  { id: "northwind", name: "Northwind Health", initials: "NH", color: "#0ea5a4", plans: ["HMO", "PPO"], coverage: 80, network: "in-network" },
  { id: "harborline", name: "Harborline Mutual", initials: "HM", color: "#2563eb", plans: ["PPO", "EPO"], coverage: 85, network: "in-network" },
  { id: "evergreen", name: "Evergreen CarePlan", initials: "EC", color: "#16a34a", plans: ["HMO"], coverage: 75, network: "in-network" },
  { id: "solace", name: "Solace Assurance", initials: "SA", color: "#8b5cf6", plans: ["PPO"], coverage: 70, network: "partial" },
  { id: "cobalt", name: "Cobalt Health Partners", initials: "CH", color: "#1e40af", plans: ["PPO", "HDHP"], coverage: 80, network: "in-network" },
  { id: "pinecrest", name: "Pinecrest Shield", initials: "PS", color: "#0f766e", plans: ["EPO"], coverage: 70, network: "partial" },
  { id: "atlas", name: "Atlas Family Cover", initials: "AF", color: "#f97316", plans: ["HMO", "PPO"], coverage: 75, network: "partial" },
  { id: "brightpath", name: "Brightpath Health", initials: "BH", color: "#e11d48", plans: ["PPO", "Medicare Advantage"], coverage: 90, network: "in-network" },
  { id: "cedarstone", name: "Cedar & Stone Mutual", initials: "CS", color: "#92400e", plans: ["PPO"], coverage: 65, network: "partial" },
  { id: "orion", name: "Orion Medical Plans", initials: "OM", color: "#4f46e5", plans: ["HMO", "Medicaid"], coverage: 80, network: "in-network" },
];

export const insurersById = Object.fromEntries(insurers.map((i) => [i.id, i])) as Record<string, Insurer>;
