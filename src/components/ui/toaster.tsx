"use client";

import { Toaster as Sonner } from "sonner";

/** App-wide toasts. Call `toast.success("Saved")` from "sonner" anywhere. */
export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast: "!rounded-2xl !border-border !bg-surface !text-foreground !shadow-lift !font-sans",
          description: "!text-muted-foreground",
          success: "[&_[data-icon]]:!text-green-600",
          error: "[&_[data-icon]]:!text-red-600",
        },
      }}
    />
  );
}
