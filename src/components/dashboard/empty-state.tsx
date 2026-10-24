import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Friendly empty screen with one of the illustrations in public/images/dashboard
 * (empty-appointments, empty-orders, empty-records, empty-claims, empty-insurance,
 * empty-messages, empty-search, empty-channel, empty-community, empty-staff-chat).
 */
export function EmptyState({
  image = "/images/dashboard/empty-search.png",
  title,
  description,
  action,
  className,
  compact,
}: {
  image?: string;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center px-4 text-center", compact ? "py-8" : "py-14", className)}>
      <Image src={image} alt="" width={200} height={200} className={compact ? "size-28" : "size-40"} />
      <h3 className="mt-3 text-lg font-bold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
