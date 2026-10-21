import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Five-star rating with partial fill. Pass `reviews` to show the count. */
export function Stars({ rating, reviews, size = "sm", className }: { rating: number; reviews?: number; size?: "sm" | "md"; className?: string }) {
  const icon = size === "md" ? "size-4.5" : "size-3.5";
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="relative inline-flex" role="img" aria-label={`Rated ${rating} out of 5`}>
        <span className="flex text-muted-foreground/30">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={cn(icon, "fill-current")} aria-hidden />
          ))}
        </span>
        <span className="absolute inset-0 flex overflow-hidden text-amber-500" style={{ width: `${(rating / 5) * 100}%` }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={cn(icon, "shrink-0 fill-current")} aria-hidden />
          ))}
        </span>
      </span>
      <span className={cn("font-semibold tabular-nums", size === "md" ? "text-sm" : "text-xs")}>{rating.toFixed(1)}</span>
      {reviews !== undefined && <span className={cn("text-muted-foreground tabular-nums", size === "md" ? "text-sm" : "text-xs")}>({reviews.toLocaleString("en-US")})</span>}
    </span>
  );
}
