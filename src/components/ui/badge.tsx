import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold [&_svg]:size-3.5",
  {
    variants: {
      variant: {
        brand: "bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200",
        blue: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200",
        coral: "bg-coral-50 text-coral-700 dark:bg-orange-950 dark:text-orange-200",
        green: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-200",
        red: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200",
        muted: "bg-muted text-muted-foreground",
        outline: "border border-border text-foreground",
        glass: "bg-white/15 text-white ring-1 ring-white/25 backdrop-blur",
      },
    },
    defaultVariants: { variant: "brand" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
