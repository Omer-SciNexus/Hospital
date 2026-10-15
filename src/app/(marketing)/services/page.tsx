import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Droplet, FlaskConical, House, UtensilsCrossed } from "lucide-react";
import { careServices, healthPackages, labTests } from "@/data/services";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { AddToCartButton } from "@/components/marketing/add-to-cart-button";
import { CtaBand } from "@/components/marketing/cta-band";
import { PackageCard } from "@/components/marketing/package-card";
import { PageHero } from "@/components/marketing/page-hero";

export const metadata: Metadata = {
  title: "Services",
  description: "Health packages, lab tests with home collection, telemedicine, pharmacy delivery and more.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        image="/images/hero/services.png"
        crumbs={[{ label: "Services" }]}
        eyebrow={<Badge variant="glass">Care beyond the hospital walls</Badge>}
        title="Services that come to you"
        description="Check-ups, lab tests, video visits and home care, booked online in minutes and covered by insurance where it applies."
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="white" size="lg">
            <a href="#packages">Health packages</a>
          </Button>
          <Button asChild size="lg" className="bg-white/10 ring-1 ring-white/30 hover:bg-white/20">
            <a href="#tests">Lab tests</a>
          </Button>
        </div>
      </PageHero>

      <section id="care" className="container-page scroll-mt-24 py-20">
        <SectionHeading eyebrow="Care services" title="Everything around your visit" align="center" />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {careServices.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 0.04}>
              <Link
                href={s.href}
                className="group flex h-full flex-col rounded-3xl border border-border bg-surface p-6 shadow-soft transition-all hover:-translate-y-1 hover:border-brand-400/50 hover:shadow-lift"
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-primary group-hover:text-primary-foreground dark:bg-brand-950 dark:text-brand-200">
                  <Icon name={s.icon} className="size-6" />
                </span>
                <h3 className="mt-5 font-display text-lg font-bold">{s.title}</h3>
                <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{s.text}</p>
                <span className="mt-4 flex items-center gap-1 text-sm font-bold text-primary">
                  Learn more <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>

      <section id="packages" className="scroll-mt-24 bg-surface-2 py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Health packages"
            title="Bundled check-ups with a doctor's review"
            description="Each package includes a follow-up consultation to go through your results."
          />
          <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {healthPackages.map((p, i) => (
              <Reveal as="li" key={p.id} delay={i * 0.05}>
                <PackageCard pkg={p} />
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section id="tests" className="container-page scroll-mt-24 py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr]">
          <div>
            <SectionHeading eyebrow="Lab tests" title="Single tests, home collection" description="Order a test, pick a time and a phlebotomist comes to you. Results land in your portal." />
            <div className="relative mt-8 aspect-[4/3] overflow-hidden rounded-3xl">
              <Image src="/images/marketplace/banners/banner-home-lab.png" alt="A lab technician taking a blood sample at a patient's home" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-2xl bg-white/95 p-4 text-slate-900 backdrop-blur">
                <House className="size-6 shrink-0 text-brand-700" aria-hidden />
                <p className="text-sm"><span className="font-bold">Free home collection</span> on orders over $50</p>
              </div>
            </div>
          </div>
          <ul className="grid content-start gap-3">
            {labTests.map((t) => (
              <li key={t.id} className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-soft">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-red-50 dark:bg-red-950/40">
                  {t.image ? (
                    <Image src={t.image} alt="" width={56} height={56} className="size-12" />
                  ) : (
                    <FlaskConical className="size-6 text-red-500" aria-hidden />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold">{t.name}</h3>
                  <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Droplet className="size-3.5" aria-hidden /> {t.sample}</span>
                    <span className="flex items-center gap-1"><Clock className="size-3.5" aria-hidden /> {t.turnaround}</span>
                    {t.fasting && <span className="flex items-center gap-1"><UtensilsCrossed className="size-3.5" aria-hidden /> Fasting</span>}
                  </p>
                </div>
                <span className="font-display text-lg font-extrabold">{formatPrice(t.price)}</span>
                <AddToCartButton item={{ id: `test-${t.id}`, name: t.name, image: t.image ?? "/images/services/test-blood.png", price: t.price }} />
              </li>
            ))}
            <li>
              <Button asChild variant="link">
                <Link href="/marketplace?category=lab-tests">
                  Browse all 1,200+ tests <ArrowRight aria-hidden />
                </Link>
              </Button>
            </li>
          </ul>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
