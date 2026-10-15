import type { Metadata } from "next";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { DoctorCard } from "@/components/marketing/doctor-card";
import { PageHero } from "@/components/marketing/page-hero";
import { doctors } from "@/data/doctors";
import { DoctorDirectory } from "./doctor-directory";

export const metadata: Metadata = {
  title: "Find a doctor",
  description: "Search Aurelia Hospital specialists by department, language and video visits, and book online.",
};

export default function DoctorsPage() {
  return (
    <>
      <PageHero
        image="/images/hero/doctors.png"
        imageAlt="Doctors and nurses standing together in a hospital corridor"
        crumbs={[{ label: "Doctors" }]}
        eyebrow={<Badge variant="glass">340+ specialists</Badge>}
        title="Find your doctor"
        description="Filter by department, language or video visits. Every profile shows the next free slot and whether your insurance is in network."
      />
      {/* The fallback is in the server HTML, so every doctor is there before JS loads the filters. */}
      <Suspense
        fallback={
          <section className="container-page py-10">
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {doctors.map((d) => (
                <li key={d.id}>
                  <DoctorCard doctor={d} />
                </li>
              ))}
            </ul>
          </section>
        }
      >
        <DoctorDirectory />
      </Suspense>
    </>
  );
}
