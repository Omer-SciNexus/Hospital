import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { AuthAside } from "./auth-aside";

/** Demo sign-in pages have nothing worth indexing. */
export const metadata: Metadata = { robots: { index: false, follow: true } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,46%)]">
      <div className="flex flex-col px-4 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden /> Back to site
          </Link>
        </div>
        <main id="main" className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center py-10">
          {children}
        </main>
      </div>
      <AuthAside />
    </div>
  );
}
