import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, HeartHandshake, Leaf, Lightbulb, ShieldCheck, Users } from "lucide-react";
import { site } from "@/config/site";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { CountUp } from "@/components/marketing/count-up";
import { CtaBand } from "@/components/marketing/cta-band";
import { PageHero } from "@/components/marketing/page-hero";

export const metadata: Metadata = {
  title: "About us",
  description: "Our story, values and the people and technology behind Aurelia Hospital.",
};

const values = [
  { icon: HeartHandshake, title: "Kindness first", text: "We explain, we listen and we treat every patient like family." },
  { icon: ShieldCheck, title: "Safety always", text: "Checklists, second checks and open reporting in every department." },
  { icon: Lightbulb, title: "Keep improving", text: "New tools only when they make care better for patients." },
  { icon: Leaf, title: "Care for our city", text: "Free screenings, school visits and a greener hospital." },
];

const timeline = [
  { year: "1998", text: "Opens as a 60-bed community hospital on Riverside Avenue." },
  { year: "2009", text: "Heart Center and the region's first 24/7 cath lab open." },
  { year: "2016", text: "New Women's Center with a level III neonatal unit." },
  { year: "2021", text: "Robotic surgery program and patient portal launch." },
  { year: "2026", text: "Health marketplace and care chat bring the hospital home." },
];

const pillars = [
  { img: "/images/about/team-meeting.png", title: "Team medicine", text: "Specialists review complex cases together at weekly boards." },
  { img: "/images/about/technology.png", title: "Modern technology", text: "Robotic surgery, 3T MRI and AI-assisted imaging." },
  { img: "/images/about/lab.png", title: "Accredited lab", text: "More than 1,200 tests, most results within 24 hours." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        image="/images/about/patient-care.png"
        imageAlt="A nurse caring for a smiling child"
        crumbs={[{ label: "About" }]}
        eyebrow={<Badge variant="glass">Since 1998</Badge>}
        title="A hospital that feels human"
        description={`For more than 25 years, ${site.name} has looked after the families of Lakeview. Today we combine modern medicine with the warmth of a community hospital.`}
      />

      <section className="container-page py-16">
        <dl className="grid grid-cols-2 gap-6 rounded-3xl border border-border bg-surface p-8 shadow-soft lg:grid-cols-4">
          {site.stats.map((s) => (
            <div key={s.label} className="flex flex-col text-center">
              <dt className="order-last mt-1 text-sm text-muted-foreground">{s.label}</dt>
              <dd className="font-display text-4xl font-extrabold text-primary">
                <CountUp value={s.value} suffix={"suffix" in s ? s.suffix : ""} decimals={"decimals" in s ? s.decimals : 0} />
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="container-page py-12">
        <SectionHeading eyebrow="What makes us different" title="Three things we invest in" />
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {pillars.map((p, i) => (
            <Reveal as="li" key={p.title} delay={i * 0.08} className="group">
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
                <Image src={p.img} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              <h3 className="mt-5 text-xl font-bold">{p.title}</h3>
              <p className="mt-1 text-muted-foreground">{p.text}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="bg-surface-2 py-20">
        <div className="container-page grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Our values" title="What guides us every day" />
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {values.map((v) => (
                <li key={v.title} className="rounded-3xl bg-surface p-6 shadow-soft">
                  <v.icon className="size-7 text-primary" aria-hidden />
                  <h3 className="mt-3 font-bold">{v.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{v.text}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeading eyebrow="Our story" title="From 60 beds to 29 departments" />
            <ol className="relative mt-8 space-y-6 border-l-2 border-brand-200 pl-8 dark:border-brand-800">
              {timeline.map((t) => (
                <li key={t.year} className="relative">
                  <span className="absolute -left-[41px] top-1 size-4 rounded-full border-4 border-surface-2 bg-primary" />
                  <p className="font-display text-lg font-extrabold text-primary">{t.year}</p>
                  <p className="text-muted-foreground">{t.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="container-page py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Award, title: "Accredited", text: "National hospital accreditation, renewed 2025." },
            { icon: Users, title: "2,400 staff", text: "Doctors, nurses, therapists and support teams." },
            { icon: ShieldCheck, title: "Patient safety", text: "Top 10% for safety in the regional quality report." },
          ].map((a) => (
            <div key={a.title} className="flex gap-4 rounded-3xl border border-border bg-surface p-6 shadow-soft">
              <a.icon className="size-8 shrink-0 text-coral-500" aria-hidden />
              <div>
                <h3 className="font-bold">{a.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{a.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="careers" className="container-page scroll-mt-24 pb-20">
        <div className="grid items-center gap-8 overflow-hidden rounded-3xl border border-border bg-surface shadow-soft md:grid-cols-2">
          <div className="relative min-h-64 self-stretch">
            <Image src="/images/hero/staff-chat.png" alt="Nurses and a doctor working together at a nurses' station" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          </div>
          <div className="p-8 md:pr-12">
            <h2 className="text-3xl font-extrabold">Work with us</h2>
            <p className="mt-3 text-muted-foreground">
              We&apos;re hiring nurses, therapists and specialists who want to do their best work in a supportive team.
            </p>
            <Button asChild className="mt-6">
              <Link href="/contact">
                Get in touch <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
