import type { Metadata } from "next";
import Link from "next/link";
import { Ambulance, Baby, Brain, Car, HeartPulse, MapPin, Phone, Siren, Stethoscope, Wind } from "lucide-react";
import { site } from "@/config/site";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { PageHero } from "@/components/marketing/page-hero";
import { ErStatus } from "./er-status";

export const metadata: Metadata = {
  title: "Emergency",
  description: `Emergency department open 24/7. Call ${site.emergencyShort} or ${site.emergencyPhone}.`,
};

const warningSigns = [
  { icon: HeartPulse, title: "Heart attack", text: "Chest pain or pressure, pain spreading to the arm or jaw, sweating, shortness of breath." },
  { icon: Brain, title: "Stroke (think FAST)", text: "Face drooping, Arm weakness, Speech difficulty: Time to call emergency services." },
  { icon: Wind, title: "Breathing trouble", text: "Severe shortness of breath, lips turning blue, or a severe allergic reaction." },
  { icon: Baby, title: "Babies and children", text: "Fever in a baby under 3 months, a seizure, or a child who is floppy or hard to wake." },
];

export default function EmergencyPage() {
  return (
    <>
      <PageHero
        tone="red"
        image="/images/hero/emergency.png"
        imageAlt="Emergency department entrance with an ambulance bay"
        crumbs={[{ label: "Emergency" }]}
        eyebrow={
          <Badge className="bg-red-500/20 text-red-100 ring-1 ring-red-300/40">
            <Siren aria-hidden /> Open 24 hours, every day
          </Badge>
        }
        title="Emergency care, any hour"
        description="If someone's life is in danger, call now. Don't wait, don't drive yourself if you feel faint, and don't use online chat or booking."
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="danger" size="lg" className="bg-red-500 hover:bg-red-600">
            <a href={`tel:${site.emergencyShort}`}>
              <Phone aria-hidden /> Call {site.emergencyShort}
            </a>
          </Button>
          <Button asChild variant="white" size="lg">
            <a href={`tel:${site.emergencyPhone}`}>
              <Ambulance aria-hidden /> Hospital ambulance {site.emergencyPhone}
            </a>
          </Button>
        </div>
      </PageHero>

      <section className="container-page grid gap-8 py-16 lg:grid-cols-[1fr_420px]">
        <div>
          <SectionHeading eyebrow="When to come in" title="Warning signs that need emergency care" />
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {warningSigns.map((s) => (
              <li key={s.title} className="rounded-3xl border border-red-100 bg-red-50/60 p-6 dark:border-red-950 dark:bg-red-950/30">
                <s.icon className="size-7 text-red-600 dark:text-red-400" aria-hidden />
                <h3 className="mt-3 text-lg font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-5 lg:pt-20">
          <ErStatus />
          <div className="rounded-3xl border border-border bg-surface p-6 shadow-soft">
            <h3 className="flex items-center gap-2 font-bold"><MapPin className="size-5 text-red-500" aria-hidden /> Getting here</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {site.address.line1}, {site.address.city}. Use the <span className="font-semibold text-foreground">East entrance</span>, which has its own drop-off bay.
            </p>
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><Car className="size-4" aria-hidden /> Free 30-minute emergency parking next to the entrance.</p>
          </div>
        </div>
      </section>

      <section className="bg-surface-2 py-16">
        <div className="container-page">
          <SectionHeading eyebrow="What happens next" title="Your visit, step by step" align="center" />
          <ol className="mt-12 grid gap-6 md:grid-cols-4">
            {[
              { t: "Arrive", d: "Check in at the desk. If you came by ambulance, the team takes you straight in." },
              { t: "Triage", d: "A nurse checks you within 10 minutes and decides how urgently you need care." },
              { t: "Treatment", d: "A doctor examines you. Tests and scans happen right in the department." },
              { t: "Next steps", d: "You go home with a plan, or we admit you. A summary goes to your portal." },
            ].map((s, i) => (
              <li key={s.t} className="relative rounded-3xl bg-surface p-6 shadow-soft">
                <span className="grid size-10 place-items-center rounded-full bg-red-500 font-display font-bold text-white">{i + 1}</span>
                <h3 className="mt-4 text-lg font-bold">{s.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-border bg-surface p-8 shadow-soft md:flex-row md:items-center">
          <div className="flex gap-4">
            <Stethoscope className="size-8 shrink-0 text-primary" aria-hidden />
            <div>
              <h2 className="text-xl font-bold">Not an emergency?</h2>
              <p className="mt-1 text-muted-foreground">For a cough, a rash or a repeat prescription, a same-day or video visit is faster.</p>
            </div>
          </div>
          <Button asChild>
            <Link href="/doctors?telehealth=1">Book a same-day visit</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
