"use client";

import Image from "next/image";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { site } from "@/config/site";
import { Button } from "@/components/ui/button";

/** Friendly fallback when a page crashes. "Try again" re-renders the segment. */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="container-page grid min-h-[70vh] place-items-center py-16 text-center">
      <div className="max-w-md">
        <Image src="/images/dashboard/error-404.png" alt="" width={220} height={220} className="mx-auto size-48" />
        <h1 className="mt-4 text-3xl font-extrabold">Something went wrong</h1>
        <p className="mt-3 text-muted-foreground">
          This page had a problem loading. Please try again. If you need urgent help, call {site.emergencyPhone}.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>
            <RotateCcw aria-hidden /> Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
