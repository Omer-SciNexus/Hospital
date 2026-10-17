import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone, Siren } from "lucide-react";
import { site } from "@/config/site";
import { PageHero } from "@/components/marketing/page-hero";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Call, email or visit Aurelia Hospital, or send us a message online.",
};

export default function ContactPage() {
  const cards = [
    { icon: Phone, title: "Call us", lines: [site.phone, "Mon–Sat, 7:00–20:00"], href: `tel:${site.phone}` },
    { icon: Mail, title: "Email", lines: [site.email, "We reply within 1 working day"], href: `mailto:${site.email}` },
    { icon: MapPin, title: "Visit", lines: [site.address.line1, `${site.address.city}, ${site.address.region} ${site.address.postal}`] },
    { icon: Clock, title: "Hours", lines: [`Outpatient: ${site.hours.outpatient}`, `Visiting: ${site.hours.visiting}`] },
  ];

  return (
    <>
      <PageHero
        image="/images/hero/contact.png"
        imageAlt="The hospital building at golden hour"
        crumbs={[{ label: "Contact" }]}
        title="We're here to help"
        description="Questions about a visit, a bill or a department? Send us a message and the right team will get back to you."
      />

      <section className="container-page py-16">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => {
            const body = (
              <>
                <span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200">
                  <c.icon className="size-5" aria-hidden />
                </span>
                <h2 className="mt-4 font-bold">{c.title}</h2>
                {c.lines.map((l) => (
                  <p key={l} className="text-sm text-muted-foreground first-of-type:font-semibold first-of-type:text-foreground">{l}</p>
                ))}
              </>
            );
            return (
              <li key={c.title}>
                {c.href ? (
                  <a href={c.href} className="block h-full rounded-3xl border border-border bg-surface p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-400/50">
                    {body}
                  </a>
                ) : (
                  <div className="h-full rounded-3xl border border-border bg-surface p-6 shadow-soft">{body}</div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-3xl border border-border bg-surface p-6 shadow-soft sm:p-10">
            <h2 className="text-2xl font-extrabold">Send a message</h2>
            <p className="mt-1 text-sm text-muted-foreground">Please don&apos;t include detailed medical information. For urgent symptoms, call us.</p>
            <ContactForm />
          </div>

          <div className="flex flex-col gap-5">
            <div className="relative min-h-72 flex-1 overflow-hidden rounded-3xl border border-border bg-brand-50 dark:bg-brand-950" aria-label="Map showing the hospital location" role="img">
              {/* Stylized map placeholder: no external map provider in the demo. */}
              <svg viewBox="0 0 400 300" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
                <rect width="400" height="300" className="fill-brand-50 dark:fill-brand-950" />
                <path d="M0 210 C 90 180 140 240 230 200 S 360 150 400 170 L400 300 L0 300Z" className="fill-sky-200/70 dark:fill-sky-900/40" />
                <g className="stroke-white dark:stroke-brand-900" strokeWidth="10" fill="none" strokeLinecap="round">
                  <path d="M-10 90 H410" />
                  <path d="M120 -10 V310" />
                  <path d="M280 -10 C 260 100 300 160 270 310" />
                </g>
                <g className="stroke-white/70 dark:stroke-brand-900/70" strokeWidth="4" fill="none">
                  <path d="M-10 40 H410" /><path d="M-10 150 H410" /><path d="M60 -10 V310" /><path d="M200 -10 V310" /><path d="M350 -10 V310" />
                </g>
                <rect x="140" y="105" width="44" height="34" rx="6" className="fill-green-300/70 dark:fill-green-900/60" />
                <rect x="300" y="20" width="40" height="55" rx="6" className="fill-green-300/70 dark:fill-green-900/60" />
              </svg>
              <div className="absolute left-[46%] top-[30%] -translate-x-1/2 -translate-y-full">
                <span className="grid size-12 place-items-center rounded-full rounded-br-none bg-primary text-primary-foreground shadow-lift rotate-45">
                  <MapPin className="size-5 -rotate-45" aria-hidden />
                </span>
              </div>
              <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-surface/95 p-4 text-sm shadow-soft backdrop-blur">
                <p className="font-bold">{site.name}</p>
                <p className="text-muted-foreground">{site.address.line1}, {site.address.city}</p>
              </div>
            </div>
            <a
              href={`tel:${site.emergencyPhone}`}
              className="flex items-center gap-3 rounded-3xl bg-red-50 p-5 font-semibold text-red-800 transition-colors hover:bg-red-100 dark:bg-red-950/50 dark:text-red-100"
            >
              <Siren className="size-6 shrink-0 text-red-600" aria-hidden />
              Emergency? Call {site.emergencyShort} or {site.emergencyPhone}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
