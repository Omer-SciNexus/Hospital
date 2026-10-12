"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Siren } from "lucide-react";
import { departmentGroups, departmentIcon, departmentsInGroup } from "@/config/departments";
import { site } from "@/config/site";

export function MegaMenu({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="container-page">
      <div className="grid animate-[menu-in_180ms_ease-out] grid-cols-[1fr_280px] gap-8 overflow-hidden rounded-3xl border border-border bg-surface p-8 shadow-lift">
        <div className="grid grid-cols-3 gap-x-8 gap-y-7">
          {departmentGroups.map((group) => (
            <div key={group.id}>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{group.name}</p>
              <ul className="space-y-0.5">
                {departmentsInGroup(group.id).map((d) => (
                  <li key={d.slug}>
                    <Link
                      href={`/departments/${d.slug}`}
                      onClick={onNavigate}
                      className="group flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm font-medium transition-colors hover:bg-brand-50 hover:text-brand-800 dark:hover:bg-brand-950 dark:hover:text-brand-200"
                    >
                      <Image
                        src={departmentIcon(d.slug)}
                        alt=""
                        width={28}
                        height={28}
                        className="size-7 transition-transform duration-300 group-hover:scale-110"
                      />
                      <span className="truncate">{d.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <Link
            href="/emergency"
            onClick={onNavigate}
            className="group relative flex min-h-48 flex-1 flex-col justify-end overflow-hidden rounded-2xl p-5 text-white"
          >
            <Image src="/images/hero/emergency.png" alt="" fill sizes="280px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
            <span className="absolute inset-0 bg-gradient-to-t from-red-950/90 via-red-950/40 to-transparent" />
            <span className="relative flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-200">
              <Siren className="size-4" aria-hidden /> Emergency
            </span>
            <span className="relative mt-1 font-display text-xl font-bold">Open 24/7</span>
            <span className="relative text-sm text-white/80">Call {site.emergencyPhone}</span>
          </Link>
          <Link
            href="/departments"
            onClick={onNavigate}
            className="flex items-center justify-between rounded-2xl bg-brand-50 px-5 py-4 text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-200"
          >
            All 29 departments
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
