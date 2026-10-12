import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="container-page flex h-20 items-center">
        <Logo />
      </header>
      <main id="main" className="container-page grid flex-1 place-items-center pb-20 text-center">
        <div className="max-w-md">
          <Image src="/images/dashboard/error-404.png" alt="" width={260} height={260} priority className="mx-auto size-56" />
          <p className="mt-4 font-display text-sm font-extrabold uppercase tracking-[0.2em] text-primary">Error 404</p>
          <h1 className="mt-2 text-4xl font-extrabold">This page took a wrong turn</h1>
          <p className="mt-3 text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/">
                <ArrowLeft aria-hidden /> Back home
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/doctors">
                <Search aria-hidden /> Find a doctor
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
