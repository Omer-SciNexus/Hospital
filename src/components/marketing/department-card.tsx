import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import { departmentIcon, departmentImage, type Department } from "@/config/departments";
import { cn } from "@/lib/utils";

/** Compact tile: 3D icon, name and summary. */
export function DepartmentTile({ department: d, className }: { department: Department; className?: string }) {
  return (
    <Link
      href={`/departments/${d.slug}`}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift",
        className,
      )}
      style={{ ["--dept" as string]: d.accent }}
    >
      <span
        className="absolute -right-10 -top-10 size-32 rounded-full opacity-15 blur-2xl transition-opacity duration-300 group-hover:opacity-40"
        style={{ background: d.accent }}
      />
      <div className="relative flex items-start justify-between">
        <Image
          src={departmentIcon(d.slug)}
          alt=""
          width={64}
          height={64}
          className="size-16 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"
        />
        <span className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-all group-hover:border-transparent group-hover:bg-[var(--dept)] group-hover:text-white">
          <ArrowUpRight className="size-4" aria-hidden />
        </span>
      </div>
      <h3 className="relative mt-4 font-display text-lg font-bold">{d.name}</h3>
      <p className="relative mt-1 line-clamp-2 text-sm text-muted-foreground">{d.summary}</p>
      {d.urgent && (
        <span className="relative mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-200">
          <Clock className="size-3" aria-hidden /> 24/7
        </span>
      )}
    </Link>
  );
}

/** Photo card with cover image. */
export function DepartmentPhotoCard({ department: d }: { department: Department }) {
  return (
    <Link
      href={`/departments/${d.slug}`}
      className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-3xl text-white shadow-soft"
    >
      <Image
        src={departmentImage(d.slug)}
        alt=""
        fill
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      <div className="relative p-5">
        <span className="mb-3 inline-grid size-12 place-items-center rounded-2xl bg-white/90 backdrop-blur">
          <Image src={departmentIcon(d.slug)} alt="" width={40} height={40} className="size-9" />
        </span>
        <h3 className="font-display text-xl font-bold">{d.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-white/80">{d.summary}</p>
      </div>
    </Link>
  );
}
