import type { Metadata } from "next";
import Link from "next/link";
import { Siren } from "lucide-react";
import { departmentGroups, departmentsInGroup } from "@/config/departments";
import { site } from "@/config/site";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/reveal";
import { CtaBand } from "@/components/marketing/cta-band";
import { DepartmentTile } from "@/components/marketing/department-card";
import { PageHero } from "@/components/marketing/page-hero";

export const metadata: Metadata = {
  title: "Departments",
  description: "All 29 departments of Aurelia Hospital, from emergency and cardiology to nutrition and physiotherapy.",
};

export default function DepartmentsPage() {
  return (
    <>
      <PageHero
        image="/images/hero/home-hero-alt.png"
        crumbs={[{ label: "Departments" }]}
        eyebrow={<Badge variant="glass">29 departments · 6 groups</Badge>}
        title="Find the right department"
        description="Every department shares one patient record, so your specialists, nurses and pharmacists always work from the same information."
      />

      <nav aria-label="Department groups" className="sticky top-16 z-30 mt-6 border-y border-border bg-background/85 backdrop-blur-xl">
        <ul className="container-page scrollbar-none flex gap-1 overflow-x-auto py-2.5">
          {departmentGroups.map((g) => (
            <li key={g.id} className="shrink-0">
              <a
                href={`#${g.id}`}
                className="block rounded-full px-4 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {g.name}
                <span className="ml-1.5 text-xs opacity-70">{departmentsInGroup(g.id).length}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="container-page space-y-16 py-14">
        <Link
          href="/emergency"
          className="flex flex-col gap-3 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-900 transition-colors hover:bg-red-100 sm:flex-row sm:items-center sm:justify-between dark:border-red-900 dark:bg-red-950/50 dark:text-red-100"
        >
          <span className="flex items-center gap-3 font-semibold">
            <Siren className="size-6 shrink-0 text-red-600" aria-hidden />
            Need help right now? The emergency department is open 24/7.
          </span>
          <span className="font-bold">Call {site.emergencyPhone} →</span>
        </Link>

        {departmentGroups.map((g) => (
          <section key={g.id} id={g.id} className="scroll-mt-36">
            <div className="mb-6 flex flex-col gap-1">
              <h2 className="text-2xl font-extrabold sm:text-3xl">{g.name}</h2>
              <p className="text-muted-foreground">{g.blurb}</p>
            </div>
            <ul className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-4">
              {departmentsInGroup(g.id).map((d, i) => (
                <Reveal as="li" key={d.slug} delay={i * 0.03}>
                  <DepartmentTile department={d} />
                </Reveal>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <CtaBand title="Not sure which department?" text="Start with internal medicine or call us, and we'll point you to the right specialist." />
    </>
  );
}
