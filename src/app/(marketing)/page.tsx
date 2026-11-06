import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  FlaskConical,
  HeartPulse,
  Microscope,
  Quote,
  ShieldCheck,
  Siren,
  Sparkles,
  Star,
  Stethoscope,
  Video,
} from "lucide-react";
import { site } from "@/config/site";
import { featuredDoctors } from "@/data/doctors";
import { healthPackages } from "@/data/services";
import { insurers } from "@/data/insurers";
import { blogPosts, homeFaqs, testimonials } from "@/data/content";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { BlogCard } from "@/components/marketing/blog-card";
import { CountUp } from "@/components/marketing/count-up";
import { CtaBand } from "@/components/marketing/cta-band";
import { DepartmentExplorer } from "@/components/marketing/department-explorer";
import { DoctorCarousel } from "@/components/marketing/doctor-carousel";
import { HeroSearch } from "@/components/marketing/hero-search";
import { InsurerLogo } from "@/components/marketing/insurer-logo";
import { PackageCard } from "@/components/marketing/package-card";

const quickActions = [
  { icon: CalendarDays, title: "Book an appointment", text: "Same-week slots in 29 departments", href: "/doctors", tone: "brand" },
  { icon: Video, title: "Video visit", text: "See a doctor from home today", href: "/doctors?telehealth=1", tone: "blue" },
  { icon: FlaskConical, title: "Lab tests at home", text: "Sample collection 7 days a week", href: "/services#tests", tone: "coral" },
  { icon: Siren, title: "Emergency", text: `24/7 · ${site.emergencyPhone}`, href: "/emergency", tone: "red" },
] as const;

const toneClasses = {
  brand: "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200",
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200",
  coral: "bg-coral-50 text-coral-700 dark:bg-orange-950 dark:text-orange-200",
  red: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200",
};

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="container-page pt-4">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-brand-950">
          <Image
            src="/images/hero/home-hero.png"
            alt="A doctor talking warmly with a senior patient in the hospital lobby"
            fill
            priority
            sizes="(min-width: 1280px) 1216px, 100vw"
            className="-z-10 object-cover object-[70%_center]"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-950/95 via-brand-950/70 to-brand-950/0 max-lg:via-brand-950/80 max-lg:to-brand-950/40" />
          <div className="grid gap-10 px-6 pb-28 pt-14 sm:px-12 sm:pt-20 lg:grid-cols-[1.2fr_1fr] lg:pb-36">
            <div className="text-white">
              <Reveal>
                <Badge variant="glass">
                  <Sparkles aria-hidden /> Rated {site.stats[3].value}/5 by 18,000+ patients
                </Badge>
              </Reveal>
              <Reveal delay={0.05}>
                <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] sm:text-6xl">
                  Modern care,
                  <br />
                  <span className="bg-gradient-to-r from-brand-300 to-sky-300 bg-clip-text text-transparent">close to home.</span>
                </h1>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-5 max-w-lg text-lg text-brand-50/90">
                  29 departments, 340+ specialists and a health marketplace, with online booking, video visits and results in your pocket.
                </p>
              </Reveal>
              <Reveal delay={0.15} className="mt-8">
                <HeroSearch />
              </Reveal>
              <Reveal delay={0.2}>
                <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-brand-100">
                  <span className="flex items-center gap-1.5"><BadgeCheck className="size-4 text-brand-300" aria-hidden /> No referral needed</span>
                  <span className="flex items-center gap-1.5"><ShieldCheck className="size-4 text-brand-300" aria-hidden /> 10 insurers accepted</span>
                  <span className="flex items-center gap-1.5"><Video className="size-4 text-brand-300" aria-hidden /> Video visits</span>
                </div>
              </Reveal>
            </div>

            <div className="relative hidden lg:block" aria-hidden>
              <Reveal delay={0.3} className="absolute right-0 top-4 w-64 rounded-2xl bg-white/95 p-4 text-slate-900 shadow-lift backdrop-blur">
                <div className="flex items-center gap-3">
                  <span className="relative size-11 overflow-hidden rounded-xl bg-brand-50">
                    <Image src="/images/doctors/dr-03.png" alt="" fill sizes="88px" className="object-cover object-top" />
                  </span>
                  <div className="text-sm">
                    <p className="font-bold">Dr. Mei Lin Chen</p>
                    <p className="text-xs text-slate-500">Pediatrics</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-xl bg-brand-50 px-3 py-2 text-xs">
                  <span className="text-slate-600">Next available</span>
                  <span className="font-bold text-brand-800">Today, 16:00</span>
                </div>
              </Reveal>
              <Reveal delay={0.45} className="absolute bottom-0 right-24 w-56 rounded-2xl bg-white/95 p-4 text-slate-900 shadow-lift backdrop-blur">
                <p className="flex items-center gap-2 text-xs font-semibold text-green-700">
                  <ShieldCheck className="size-4" /> Northwind Health · In network
                </p>
                <p className="mt-1 font-display text-2xl font-extrabold">Insurance pays 80%</p>
                <p className="text-xs text-slate-500">Shown before you book</p>
              </Reveal>
            </div>
          </div>
        </div>

        {/* Quick actions overlap the hero */}
        <div className="relative z-10 -mt-20 px-3 sm:px-8">
          <ul className="grid gap-3 rounded-3xl border border-border bg-surface p-3 shadow-lift sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((a, i) => (
              <Reveal as="li" key={a.title} delay={0.1 + i * 0.05}>
                <Link href={a.href} className="group flex items-center gap-4 rounded-2xl p-4 transition-colors hover:bg-muted">
                  <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${toneClasses[a.tone]}`}>
                    <a.icon className="size-6" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{a.title}</span>
                    <span className="block truncate text-sm text-muted-foreground">{a.text}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" aria-hidden />
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Stats */}
      <section className="container-page py-16">
        <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {site.stats.map((s) => (
            <div key={s.label} className="text-center">
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-display text-4xl font-extrabold text-primary sm:text-5xl">
                <CountUp value={s.value} suffix={"suffix" in s ? s.suffix : ""} decimals={"decimals" in s ? s.decimals : 0} />
              </dd>
              <dd aria-hidden className="mt-1 text-sm font-medium text-muted-foreground">{s.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Departments */}
      <section className="container-page py-12">
        <SectionHeading
          eyebrow="Departments"
          title="Every specialty, one hospital"
          description="From the emergency room to the dietitian's office, all 29 departments share one record, so your care team always sees the full picture."
          action={
            <Button asChild variant="outline">
              <Link href="/departments">
                All 29 departments <ArrowRight aria-hidden />
              </Link>
            </Button>
          }
        />
        <div className="mt-10">
          <DepartmentExplorer limit={8} />
        </div>
      </section>

      {/* Why us */}
      <section className="container-page py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal className="grid grid-cols-2 gap-4">
            <div className="relative overflow-hidden rounded-3xl">
              <Image src="/images/about/patient-care.png" alt="A nurse caring for a smiling child" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover object-[70%_center]" />
            </div>
            <div className="flex flex-col gap-4">
              <div className="relative aspect-square overflow-hidden rounded-3xl">
                <Image src="/images/about/technology.png" alt="Robotic operating room" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
              </div>
              <div className="rounded-3xl bg-coral-700 p-5 text-white">
                <p className="font-display text-4xl font-extrabold">98%</p>
                <p className="text-sm text-white/90">of patients would recommend us to family</p>
              </div>
            </div>
          </Reveal>
          <div>
            <SectionHeading
              eyebrow="Why Aurelia"
              title="Hospital-grade care that feels personal"
              description="We built every part of the visit around you: shorter waits, clear explanations and a team that keeps talking to you after you go home."
            />
            <ul className="mt-8 grid gap-5 sm:grid-cols-2">
              {[
                { icon: Stethoscope, title: "Specialists who coordinate", text: "One record and a named lead doctor across departments." },
                { icon: Microscope, title: "Results in 24 hours", text: "Accredited lab and imaging, straight to your portal." },
                { icon: HeartPulse, title: "Care after discharge", text: "Care chat, home nursing and follow-ups by video." },
                { icon: ShieldCheck, title: "Clear prices", text: "See what insurance pays before you book or buy." },
              ].map((f, i) => (
                <Reveal as="li" key={f.title} delay={i * 0.05} className="flex gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200">
                      <f.icon className="size-5" aria-hidden />
                    </span>
                    <div>
                      <h3 className="font-bold">{f.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
                    </div>
                </Reveal>
              ))}
            </ul>
            <Button asChild variant="link" className="mt-8">
              <Link href="/about">
                More about us <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Doctors */}
      <section className="bg-surface-2 py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Our doctors"
            title="Meet the people behind your care"
            description="Experienced, warm and easy to reach. Filter by department, language or video visits."
            action={
              <Button asChild variant="outline">
                <Link href="/doctors">
                  Find a doctor <ArrowRight aria-hidden />
                </Link>
              </Button>
            }
          />
          <div className="mt-4">
            <DoctorCarousel doctors={featuredDoctors} />
          </div>
        </div>
      </section>

      {/* Marketplace teaser */}
      <section className="container-page py-20">
        <SectionHeading
          eyebrow="Marketplace"
          title={
            <>
              Your hospital, <span className="text-coral-600">now a store</span>
            </>
          }
          description="Order lab tests, medicines, devices and mobility rentals, all checked by our clinicians and covered by your insurance where it applies."
          action={
            <Button asChild variant="accent">
              <Link href="/marketplace">
                Visit the marketplace <ArrowRight aria-hidden />
              </Link>
            </Button>
          }
        />
        <div className="mt-10 grid gap-4 md:grid-cols-4 md:grid-rows-2">
          {[
            { img: "banner-pharmacy", title: "Pharmacy", text: "Upload your Rx, delivered today", cls: "md:col-span-2 md:row-span-2", bg: "from-emerald-950/80" },
            { img: "banner-devices", title: "Devices", text: "20% off monitors this week", cls: "md:col-span-2", bg: "from-blue-950/80" },
            { img: "banner-home-lab", title: "Home lab", text: "From $19 per test", cls: "", bg: "from-brand-950/80" },
            { img: "banner-telemedicine", title: "Video visits", text: "Specialists from $60", cls: "", bg: "from-indigo-950/80" },
          ].map((b, i) => (
            <Reveal key={b.img} delay={i * 0.06} className={b.cls}>
              <Link
                href="/marketplace"
                className="group relative flex h-full min-h-56 flex-col justify-end overflow-hidden rounded-3xl p-6 text-white"
              >
                <Image
                  src={`/images/marketplace/banners/${b.img}.png`}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span className={`absolute inset-0 bg-gradient-to-t ${b.bg} via-transparent to-transparent`} />
                <span className="relative font-display text-2xl font-extrabold">{b.title}</span>
                <span className="relative flex items-center gap-1 text-sm text-white/85">
                  {b.text} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Packages */}
      <section className="container-page py-12">
        <SectionHeading
          eyebrow="Health packages"
          title="Check-ups that check everything"
          description="Bundled tests with a doctor's review, at a lower price than booking each test on its own."
          action={
            <Button asChild variant="outline">
              <Link href="/services#packages">
                All packages <ArrowRight aria-hidden />
              </Link>
            </Button>
          }
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {healthPackages.slice(0, 3).map((p, i) => (
            <Reveal key={p.id} delay={i * 0.06}>
              <PackageCard pkg={p} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Insurance strip */}
      <section className="py-16">
        <div className="container-page mb-8 flex flex-col items-center gap-3 text-center">
          <p className="text-sm font-semibold text-muted-foreground">We work with 10 insurance companies, with more joining every month</p>
          <Link href="/insurance" className="text-sm font-bold text-primary hover:underline">
            Check your coverage →
          </Link>
        </div>
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <ul className="flex w-max animate-marquee gap-12 hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]">
            {[...insurers, ...insurers].map((ins, i) => (
              <li key={`${ins.id}-${i}`} aria-hidden={i >= insurers.length} className="shrink-0 opacity-80 transition-opacity hover:opacity-100">
                <InsurerLogo insurer={ins} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container-page py-16">
        <SectionHeading eyebrow="Patient stories" title="In their words" align="center" />
        <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((t, i) => (
            <Reveal as="li" key={t.name} delay={i * 0.06} className="flex h-full flex-col rounded-3xl border border-border bg-surface p-6 shadow-soft">
                <Quote className="size-8 text-brand-300" aria-hidden />
                <div className="mt-3 flex gap-0.5" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="size-4 fill-amber-400 text-amber-400" aria-hidden />
                  ))}
                </div>
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed">“{t.quote}”</blockquote>
                <div className="mt-5 flex items-center gap-3">
                  <span className="relative size-10 overflow-hidden rounded-full bg-brand-50">
                    <Image src={t.avatar} alt="" fill sizes="80px" className="object-cover" />
                  </span>
                  <div className="text-sm">
                    <p className="font-bold">{t.name}</p>
                    <p className="text-muted-foreground">{t.role}</p>
                  </div>
                </div>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* Blog */}
      <section className="container-page py-16">
        <SectionHeading
          eyebrow="Health blog"
          title="Advice from our specialists"
          action={
            <Button asChild variant="outline">
              <Link href="/blog">
                All articles <ArrowRight aria-hidden />
              </Link>
            </Button>
          }
        />
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {blogPosts.slice(0, 3).map((p, i) => (
            <Reveal key={p.slug} delay={i * 0.06}>
              <BlogCard post={p} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container-page py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeading
            eyebrow="FAQ"
            title="Questions, answered"
            description={
              <>
                Can&apos;t find what you need?{" "}
                <Link href="/contact" className="font-semibold text-primary hover:underline">
                  Contact us
                </Link>
                .
              </>
            }
          />
          <Accordion type="single" collapsible className="rounded-3xl border border-border bg-surface px-6 shadow-soft">
            {homeFaqs.map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger>{f.q}</AccordionTrigger>
                <AccordionContent>{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
