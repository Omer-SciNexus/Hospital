import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow-soft hover:bg-brand-800 dark:hover:bg-brand-300",
        secondary: "bg-secondary text-secondary-foreground shadow-soft hover:bg-blue-700",
        accent: "bg-coral-700 text-white shadow-soft hover:bg-coral-800 dark:bg-accent dark:text-accent-foreground dark:hover:bg-coral-500",
        danger: "bg-red-600 text-white shadow-soft hover:bg-red-700",
        outline: "border border-border bg-surface text-foreground hover:border-brand-400 hover:text-primary",
        soft: "bg-brand-50 text-brand-800 hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-200 dark:hover:bg-brand-900",
        ghost: "text-foreground hover:bg-muted",
        white: "bg-white text-brand-900 shadow-soft hover:bg-brand-50",
        link: "rounded-none px-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-13 px-7 text-base",
        icon: "size-10",
      },
    },
    compoundVariants: [{ variant: "link", className: "h-auto px-0" }],
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
