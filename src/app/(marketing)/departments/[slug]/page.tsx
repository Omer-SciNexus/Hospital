import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarDays, Check, Clock, MapPin, ShoppingBag, Siren } from "lucide-react";
import {
  departmentGroups,
  departmentIcon,
  departmentImage,
  departments,
  departmentsInGroup,
  getDepartment,
} from "@/config/departments";
import { categoriesById, categoryImage } from "@/config/marketplace";
import { site } from "@/config/site";
import { doctorsInDepartment } from "@/data/doctors";
import { productsForDepartment } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { CtaBand } from "@/components/marketing/cta-band";
import { DepartmentTile } from "@/components/marketing/department-card";
import { DoctorCard } from "@/components/marketing/doctor-card";
import { Breadcrumbs } from "@/components/marketing/page-hero";
import { ProductRow } from "@/components/shop/product-row";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return departments.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = getDepartment((await params).slug);
  return d ? { title: d.name, description: d.summary } : {};
}

export default async function DepartmentPage({ params }: Props) {
  const d = getDepartment((await params).slug);
  if (!d) notFound();

  const group = departmentGroups.find((g) => g.id === d.group)!;
  const team = doctorsInDepartment(d.slug);
  const related = departmentsInGroup(d.group).filter((x) => x.slug !== d.slug).slice(0, 4);
  const shop = productsForDepartment(d.slug)
    .sort((a, b) => b.rating * Math.log(b.reviews) - a.rating * Math.log(a.reviews))
    .slice(0, 8);

  return (
    <div style={{ ["--dept" as string]: d.accent }}>
      {/* Hero */}
      <section className="container-page pt-6">
        <div className="grid overflow-hidden rounded-3xl border border-border bg-surface shadow-soft lg:grid-cols-[1.05fr_1fr]">
          <div className="relative flex flex-col justify-center p-6 sm:p-12">
            <span className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full opacity-20 blur-3xl" style={{ background: d.accent }} />
            <Breadcrumbs items={[{ label: "Departments", href: "/departments" }, { label: d.name }]} />
            <div className="relative mt-8 flex items-center gap-4">
              <Image src={departmentIcon(d.slug)} alt="" width={80} height={80} priority className="size-20" />
              <span className="text-dept rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider" style={{ background: `${d.accent}1f` }}>
                {group.name}
              </span>
            </div>
            <h1 className="relative mt-5 text-4xl font-extrabold sm:text-5xl">{d.name}</h1>
            <p className="relative mt-4 max-w-lg text-lg text-muted-foreground">{d.summary}</p>
            <dl className="relative mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center gap-2">
                <dt className="sr-only">Location</dt>
                <MapPin className="size-4 text-muted-foreground" aria-hidden />
                <dd>{d.location}</dd>
              </div>
              <div className="flex items-center gap-2">
                <dt className="sr-only">Hours</dt>
                <Clock className="size-4 text-muted-foreground" aria-hidden />
                <dd className={d.urgent ? "font-semibold text-red-600 dark:text-red-400" : undefined}>{d.hours}</dd>
              </div>
            </dl>
            <div className="relative mt-8 flex flex-wrap gap-3">
              {d.slug === "emergency" ? (
                <Button asChild variant="danger" size="lg">
                  <a href={`tel:${site.emergencyPhone}`}>
                    <Siren aria-hidden /> Call {site.emergencyPhone}
                  </a>
                </Button>
              ) : (
                <Button asChild size="lg">
                  <Link href={`/doctors?department=${d.slug}`}>
                    <CalendarDays aria-hidden /> Book an appointment
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" size="lg">
                <Link href={`/marketplace?department=${d.slug}`}>
                  <ShoppingBag aria-hidden /> Shop this department
                </Link>
              </Button>
            </div>
          </div>
          <div className="relative min-h-72 lg:min-h-[520px]">
            <Image
              src={departmentImage(d.slug)}
              alt={`Inside the ${d.name} department`}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* About + services + conditions */}
      <section className="container-page grid gap-10 py-16 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <SectionHeading eyebrow="About the department" title={`Care in ${d.name.replace(/\s*\(.*\)/, "")}`} />
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{d.description}</p>
          <h3 className="mt-10 text-xl font-bold">Services</h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {d.services.map((s) => (
              <li key={s} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-sm font-medium shadow-soft">
                <span className="grid size-7 shrink-0 place-items-center rounded-full text-white" style={{ background: d.accent }}>
                  <Check className="size-4" aria-hidden />
                </span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <aside className="space-y-6">
          <div className="rounded-3xl p-6" style={{ background: `${d.accent}14` }}>
            <h3 className="text-lg font-bold">Conditions we treat</h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {d.conditions.map((c) => (
                <li key={c} className="rounded-full bg-surface px-3 py-1.5 text-sm font-medium shadow-soft">
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-border bg-surface p-6 shadow-soft">
            <h3 className="text-lg font-bold">Before your visit</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Bring your ID, insurance card and a list of your medicines.</li>
              <li>Arrive 15 minutes early, or check in online from your portal.</li>
              <li>Results and visit notes appear in your patient portal.</li>
            </ul>
            <Link href="/insurance" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
              Check your insurance <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </aside>
      </section>

      {/* Team */}
      <section className="bg-surface-2 py-16">
        <div className="container-page">
          <SectionHeading
            eyebrow="The team"
            title={`Meet our ${d.name.replace(/\s*\(.*\)/, "").toLowerCase()} specialists`}
            action={
              <Button asChild variant="outline">
                <Link href={`/doctors?department=${d.slug}`}>
                  See all <ArrowRight aria-hidden />
                </Link>
              </Button>
            }
          />
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((doc, i) => (
              <Reveal as="li" key={doc.id} delay={i * 0.05}>
                <DoctorCard doctor={doc} />
              </Reveal>
            ))}
            <li className="flex flex-col justify-center rounded-3xl border border-dashed border-border p-6 text-center">
              <p className="font-display text-lg font-bold">Not sure who to see?</p>
              <p className="mt-2 text-sm text-muted-foreground">Our care coordinators will match you with the right specialist.</p>
              <Button asChild variant="soft" size="sm" className="mx-auto mt-4">
                <Link href="/contact">Ask a coordinator</Link>
              </Button>
            </li>
          </ul>
        </div>
      </section>

      {/* Shop this department */}
      <section className="container-page py-16">
        <SectionHeading
          eyebrow="Marketplace"
          title="Shop for this department"
          description="Products and services our clinicians recommend for patients of this department."
        />
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {d.marketplaceCategories.map((id) => {
            const c = categoriesById[id];
            return (
              <li key={id}>
                <Link
                  href={`/marketplace?category=${id}&department=${d.slug}`}
                  className="group flex h-full flex-col items-center rounded-2xl border border-border bg-surface p-5 text-center shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift"
                >
                  <Image src={categoryImage(id)} alt="" width={80} height={80} className="size-20 transition-transform duration-500 group-hover:scale-110" />
                  <span className="mt-3 font-bold">{c.name}</span>
                  <span className="mt-1 text-xs text-muted-foreground">{c.blurb}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        {shop.length > 0 && (
          <div className="mt-12">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h3 className="text-2xl font-extrabold">Shop for {d.name.replace(/\s*\(.*\)/, "")}</h3>
              <Link href={`/marketplace?department=${d.slug}#catalog`} className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
                See all products <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <ProductRow products={shop} className="mt-6" />
          </div>
        )}
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="container-page pb-20">
          <SectionHeading eyebrow={group.name} title="Related departments" />
          <ul className="mt-8 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => (
              <li key={r.slug}>
                <DepartmentTile department={r} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <CtaBand />
    </div>
  );
}
