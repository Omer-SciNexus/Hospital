import Link from "next/link";
import { CalendarDays, Phone } from "lucide-react";
import { site } from "@/config/site";
import { Button } from "@/components/ui/button";

export function CtaBand({
  title = "Ready when you are.",
  text = "Book online in under a minute, or call us and we'll find the right doctor for you.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="container-page">
      <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-blue-700 px-6 py-14 text-white sm:px-14">
        <div className="bg-grid absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="absolute -right-20 -top-24 -z-10 size-80 rounded-full bg-coral-500/30 blur-3xl" />
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div className="max-w-xl">
            <h2 className="text-3xl font-extrabold sm:text-4xl">{title}</h2>
            <p className="mt-3 text-lg text-brand-50/90">{text}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="white" size="lg">
              <Link href="/doctors">
                <CalendarDays aria-hidden /> Book a visit
              </Link>
            </Button>
            <Button asChild size="lg" className="bg-white/10 ring-1 ring-white/30 hover:bg-white/20">
              <a href={`tel:${site.phone}`}>
                <Phone aria-hidden /> {site.phone}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
