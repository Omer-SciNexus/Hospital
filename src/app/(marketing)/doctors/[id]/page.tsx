import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, BriefcaseMedical, GraduationCap, Languages, MapPin, ShieldCheck, Star, Video } from "lucide-react";
import { departmentsBySlug } from "@/config/departments";
import { doctors, doctorsById, doctorsInDepartment } from "@/data/doctors";
import { insurersById } from "@/data/insurers";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DoctorCard, DoctorPortrait } from "@/components/marketing/doctor-card";
import { InsurerLogo } from "@/components/marketing/insurer-logo";
import { Breadcrumbs } from "@/components/marketing/page-hero";
import { BookingWidget } from "./booking-widget";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return doctors.map((d) => ({ id: d.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = doctorsById[(await params).id];
  return d ? { title: d.name, description: `${d.title}. ${d.bio}` } : {};
}

export default async function DoctorPage({ params }: Props) {
  const doctor = doctorsById[(await params).id];
  if (!doctor) notFound();
  const dept = departmentsBySlug[doctor.department];
  const colleagues = doctorsInDepartment(doctor.department).filter((d) => d.id !== doctor.id).slice(0, 3);
  const fallback = doctors.filter((d) => d.photo && d.id !== doctor.id).slice(0, 3);
  const more = colleagues.length ? colleagues : fallback;

  return (
    <>
      <section className="container-page pt-8">
        <Breadcrumbs items={[{ label: "Doctors", href: "/doctors" }, { label: doctor.name }]} />
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_400px]">
          <div className="space-y-8">
            <div className="grid gap-6 overflow-hidden rounded-3xl border border-border bg-surface p-4 shadow-soft sm:grid-cols-[240px_1fr] sm:p-5">
              <DoctorPortrait doctor={doctor} sizes="240px" className="aspect-[4/5] rounded-2xl" />
              <div className="flex flex-col py-2">
                <Link href={`/departments/${dept.slug}`} className="text-dept w-fit text-xs font-bold uppercase tracking-wider hover:underline" style={{ ["--dept" as string]: dept.accent }}>
                  {dept.name}
                </Link>
                <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{doctor.name}</h1>
                <p className="mt-1 text-muted-foreground">{doctor.title}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="muted" className="gap-1 py-1">
                    <Star className="fill-amber-400 text-amber-400" aria-hidden /> {doctor.rating.toFixed(1)} · {doctor.reviews} reviews
                  </Badge>
                  {doctor.telehealth && (
                    <Badge className="py-1">
                      <Video aria-hidden /> Video visits
                    </Badge>
                  )}
                  <Badge variant="green" className="py-1">
                    <ShieldCheck aria-hidden /> In network with {doctor.insurers.length} insurers
                  </Badge>
                </div>
                <dl className="mt-auto grid grid-cols-2 gap-4 pt-6 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="flex items-center gap-1.5 text-muted-foreground"><BriefcaseMedical className="size-4" aria-hidden /> Experience</dt>
                    <dd className="mt-1 font-bold">{doctor.experience} years</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1.5 text-muted-foreground"><Award className="size-4" aria-hidden /> Visit fee</dt>
                    <dd className="mt-1 font-bold">{formatPrice(doctor.fee)}</dd>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <dt className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="size-4" aria-hidden /> Location</dt>
                    <dd className="mt-1 font-bold">{dept.location}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-surface p-6 shadow-soft sm:p-8">
              <h2 className="text-xl font-bold">About</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{doctor.bio}</p>
              <div className="mt-8 grid gap-8 sm:grid-cols-2">
                <div>
                  <h3 className="flex items-center gap-2 font-bold"><GraduationCap className="size-5 text-primary" aria-hidden /> Education</h3>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {doctor.education.map((e) => <li key={e}>{e}</li>)}
                  </ul>
                </div>
                <div>
                  <h3 className="flex items-center gap-2 font-bold"><Languages className="size-5 text-primary" aria-hidden /> Languages</h3>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {doctor.languages.map((l) => (
                      <li key={l} className="rounded-full bg-muted px-3 py-1 text-sm font-medium">{l}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <h3 className="mt-8 font-bold">Accepted insurance</h3>
              <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-3 text-sm">
                {doctor.insurers.map((id) => (
                  <li key={id}><InsurerLogo insurer={insurersById[id]} /></li>
                ))}
              </ul>
            </div>
          </div>

          <div id="book" className="scroll-mt-24 lg:sticky lg:top-24 lg:self-start">
            <BookingWidget doctorId={doctor.id} />
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <h2 className="text-2xl font-extrabold">{colleagues.length ? `More from ${dept.name}` : "Other doctors you might like"}</h2>
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {more.map((d) => (
            <li key={d.id}><DoctorCard doctor={d} /></li>
          ))}
        </ul>
      </section>
    </>
  );
}
