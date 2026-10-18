import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { insurers } from "@/data/insurers";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { InsurerLogo } from "@/components/marketing/insurer-logo";
import { PageHero } from "@/components/marketing/page-hero";
import { CoverageChecker } from "./coverage-checker";

export const metadata: Metadata = {
  title: "Accepted insurance",
  description: "Insurance companies we work with, how coverage works, and how to add your card.",
};

const steps = [
  { img: "card", title: "Add your card", text: "Upload a photo of your card and member ID in the patient portal." },
  { img: "in-network", title: "We verify it", text: "Our billing team checks your plan with the insurer, usually the same day." },
  { img: "coverage", title: "See coverage up front", text: "Booking and checkout show 'In network' and what insurance pays." },
  { img: "claim", title: "We send the claim", text: "After your visit or order we file the claim and you can track it." },
];

const faqs = [
  { q: "What if my insurance isn't listed?", a: "You can still be seen. We'll give you an itemized receipt to send to your insurer, and our billing team can help." },
  { q: "What is a pre-approval?", a: "Some procedures and scans need your insurer's approval first. We request it for you and you'll see the status in your portal before your visit." },
  { q: "What does 'partly in network' mean?", a: "Your insurer covers some of our doctors and services but not all. Each doctor's profile shows whether they are in network for your plan." },
  { q: "My claim was denied. What now?", a: "You'll see the reason in your portal. Message billing from the claim and we'll help you appeal or set up a payment plan." },
];

export default function InsurancePage() {
  return (
    <>
      <PageHero
        image="/images/hero/insurance.png"
        imageAlt="Billing staff explaining a document to a smiling couple"
        crumbs={[{ label: "Insurance" }]}
        eyebrow={<Badge variant="glass">10 insurance companies</Badge>}
        title="Insurance, made clear"
        description="Know what you'll pay before you book. Add your card once, and we handle verification and claims."
      >
        <Button asChild variant="white" size="lg">
          <Link href="/sign-in?next=/dashboard/insurance">
            Add my insurance card <ArrowRight aria-hidden />
          </Link>
        </Button>
      </PageHero>

      <section className="container-page py-20">
        <SectionHeading eyebrow="How it works" title="Four steps, then it just works" align="center" />
        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 0.06} className="relative rounded-3xl border border-border bg-surface p-6 text-center shadow-soft">
              <span className="absolute left-5 top-5 font-display text-sm font-extrabold text-muted-foreground">0{i + 1}</span>
              <Image src={`/images/icons/insurance/${s.img}.png`} alt="" width={112} height={112} className="mx-auto size-24" />
              <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="bg-surface-2 py-20">
        <div className="container-page">
          <SectionHeading eyebrow="Accepted insurance" title="Companies we work with" description="Coverage shown is typical for in-network outpatient care. Your plan may differ." />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {insurers.map((ins) => (
              <li key={ins.id} className="flex flex-col rounded-3xl border border-border bg-surface p-5 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <InsurerLogo insurer={ins} />
                  <Badge variant={ins.network === "in-network" ? "green" : "coral"}>
                    {ins.network === "in-network" ? "In network" : "Partly in network"}
                  </Badge>
                </div>
                <div className="mt-5 flex items-end justify-between">
                  <ul className="flex flex-wrap gap-1.5">
                    {ins.plans.map((p) => (
                      <li key={p} className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">{p}</li>
                    ))}
                  </ul>
                  <p className="text-right">
                    <span className="block font-display text-2xl font-extrabold">{ins.coverage}%</span>
                    <span className="text-xs text-muted-foreground">typical coverage</span>
                  </p>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${ins.coverage}%`, background: ins.color }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-muted-foreground">All insurance company names on this demo site are made up.</p>
        </div>
      </section>

      <section className="container-page grid items-center gap-10 py-20 lg:grid-cols-2">
        <CoverageChecker />
        <div className="flex flex-col items-start gap-6 sm:flex-row lg:flex-col">
          <Image src="/images/dashboard/preapproval.png" alt="" width={180} height={180} className="size-40 shrink-0" />
          <div>
            <h2 className="text-3xl font-extrabold">Pre-approvals, handled</h2>
            <p className="mt-3 text-muted-foreground">
              For surgery, MRI and some treatments your insurer needs to approve first. We request it as soon as your doctor
              orders it, and you&apos;ll see &ldquo;approved&rdquo; in your portal before you come in.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page pb-8">
        <div className="mx-auto max-w-3xl">
          <SectionHeading eyebrow="FAQ" title="Insurance questions" align="center" />
          <Accordion type="single" collapsible className="mt-8 rounded-3xl border border-border bg-surface px-6 shadow-soft">
            {faqs.map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger>{f.q}</AccordionTrigger>
                <AccordionContent>{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </>
  );
}
