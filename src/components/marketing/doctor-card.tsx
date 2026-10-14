import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Star, Video } from "lucide-react";
import { departmentsBySlug } from "@/config/departments";
import type { Doctor } from "@/data/doctors";
import { cn, initials } from "@/lib/utils";

export function DoctorPortrait({ doctor, className, sizes }: { doctor: Doctor; className?: string; sizes: string }) {
  const accent = departmentsBySlug[doctor.department]?.accent ?? "#0ea5a4";
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ background: `linear-gradient(160deg, ${accent}26, ${accent}0d)` }}
    >
      {doctor.photo ? (
        <Image src={doctor.photo} alt={doctor.name} fill sizes={sizes} className="object-cover object-top" />
      ) : (
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-dept font-display text-5xl font-extrabold" style={{ ["--dept" as string]: accent }}>
            {initials(doctor.name)}
          </span>
        </div>
      )}
    </div>
  );
}

export function DoctorCard({ doctor }: { doctor: Doctor }) {
  const dept = departmentsBySlug[doctor.department];
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      <DoctorPortrait
        doctor={doctor}
        sizes="(min-width: 1280px) 300px, (min-width: 640px) 45vw, 100vw"
        className="aspect-[4/4.2] transition-transform"
      />
      {doctor.telehealth && (
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-brand-800 backdrop-blur">
          <Video className="size-3.5" aria-hidden /> Video visits
        </span>
      )}
      <div className="flex flex-1 flex-col p-5">
        <p className="text-dept text-xs font-bold uppercase tracking-wider" style={{ ["--dept" as string]: dept?.accent }}>
          {dept?.name}
        </p>
        <h3 className="mt-1 font-display text-lg font-bold">
          <Link href={`/doctors/${doctor.id}`} className="after:absolute after:inset-0">
            {doctor.name}
          </Link>
        </h3>
        <p className="text-sm text-muted-foreground">{doctor.title}</p>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm">
          <span className="flex items-center gap-1 font-semibold">
            <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
            {doctor.rating.toFixed(1)}
            <span className="font-normal text-muted-foreground">({doctor.reviews})</span>
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarDays className="size-4" aria-hidden />
            {doctor.nextAvailable}
          </span>
        </div>
      </div>
    </article>
  );
}
