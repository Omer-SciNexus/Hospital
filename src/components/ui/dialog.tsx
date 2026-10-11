"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

/** Centered modal. Pass `size` to widen it; content scrolls when taller than the screen. */
export function DialogContent({
  className,
  children,
  size = "md",
  hideClose,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { size?: "sm" | "md" | "lg" | "xl"; hideClose?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-brand-950/50 backdrop-blur-sm data-[state=open]:animate-[fade-in_200ms_ease-out]" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-border bg-surface p-6 shadow-lift outline-none data-[state=open]:animate-[dialog-in_220ms_cubic-bezier(.2,.8,.2,1)] sm:p-8",
          { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-3xl", xl: "max-w-5xl" }[size],
          className,
        )}
        {...props}
      >
        {children}
        {!hideClose && (
          <DialogPrimitive.Close
            className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-muted text-foreground transition-colors hover:bg-brand-100 dark:hover:bg-brand-900"
            aria-label="Close"
          >
            <X className="size-4" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("pr-10 font-display text-xl font-extrabold", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("mt-1.5 text-sm text-muted-foreground", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}
