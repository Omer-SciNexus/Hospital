"use client";

import * as React from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;
export const SheetTitle = Dialog.Title;
export const SheetDescription = Dialog.Description;

export function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof Dialog.Content> & { side?: "left" | "right" }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-brand-950/40 backdrop-blur-sm data-[state=open]:animate-[fade-in_200ms_ease-out]" />
      <Dialog.Content
        className={cn(
          "fixed inset-y-0 z-50 flex w-[88vw] max-w-sm flex-col bg-surface shadow-lift outline-none",
          side === "right"
            ? "right-0 data-[state=open]:animate-[slide-in-right_300ms_cubic-bezier(.2,.8,.2,1)]"
            : "left-0 data-[state=open]:animate-[slide-in-left_300ms_cubic-bezier(.2,.8,.2,1)]",
          className,
        )}
        {...props}
      >
        {children}
        <Dialog.Close
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-muted text-foreground transition-colors hover:bg-brand-100"
          aria-label="Close"
        >
          <X className="size-4" />
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
