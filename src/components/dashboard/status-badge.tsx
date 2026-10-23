import { Badge } from "@/components/ui/badge";

type Variant = "brand" | "blue" | "coral" | "green" | "red" | "muted" | "outline";

/**
 * One place that maps every status word in the app to a badge color, so
 * "approved" looks the same on the patient and billing screens.
 */
const map: Record<string, { variant: Variant; label?: string }> = {
  // generic
  active: { variant: "green" },
  inactive: { variant: "muted" },
  draft: { variant: "muted" },
  // insurance
  pending: { variant: "coral", label: "Pending" },
  verified: { variant: "green" },
  rejected: { variant: "red" },
  submitted: { variant: "blue" },
  "in-review": { variant: "blue", label: "In review" },
  approved: { variant: "green" },
  partial: { variant: "coral", label: "Partly approved" },
  denied: { variant: "red" },
  requested: { variant: "coral" },
  // orders
  "rx-review": { variant: "coral", label: "Rx check" },
  placed: { variant: "blue" },
  processing: { variant: "blue" },
  shipped: { variant: "brand" },
  delivered: { variant: "green" },
  cancelled: { variant: "muted" },
  // lab
  scheduled: { variant: "muted" },
  collected: { variant: "blue" },
  resulted: { variant: "green" },
  // appointments
  upcoming: { variant: "blue" },
  completed: { variant: "green" },
  "checked-in": { variant: "brand", label: "Checked in" },
  "no-show": { variant: "red", label: "No-show" },
  // patients
  stable: { variant: "green" },
  observation: { variant: "coral" },
  critical: { variant: "red" },
  outpatient: { variant: "blue" },
  discharged: { variant: "muted" },
  // stock / invoices
  "in-stock": { variant: "green", label: "In stock" },
  "low-stock": { variant: "coral", label: "Low stock" },
  "out-of-stock": { variant: "red", label: "Out of stock" },
  paid: { variant: "green" },
  unpaid: { variant: "coral" },
  overdue: { variant: "red" },
  // presence / urgency
  online: { variant: "green" },
  busy: { variant: "red" },
  away: { variant: "coral" },
  offline: { variant: "muted" },
  urgent: { variant: "red" },
  routine: { variant: "muted" },
  // dose rounds
  due: { variant: "coral" },
  given: { variant: "green" },
  missed: { variant: "red" },
  held: { variant: "muted" },
};

export function StatusBadge({ status, label, className }: { status: string; label?: string; className?: string }) {
  const entry = map[status] ?? { variant: "muted" as const };
  const text = label ?? entry.label ?? status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, " ");
  return (
    <Badge variant={entry.variant} className={className}>
      {text}
    </Badge>
  );
}
