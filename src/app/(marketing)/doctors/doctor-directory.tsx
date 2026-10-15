"use client";

import { useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, SlidersHorizontal, Video, X } from "lucide-react";
import { departments, departmentsBySlug } from "@/config/departments";
import { doctors } from "@/data/doctors";
import { insurers } from "@/data/insurers";
import { NativeSelect } from "@/components/ui/form-controls";
import { DoctorCard } from "@/components/marketing/doctor-card";
import { cn } from "@/lib/utils";

const languages = Array.from(new Set(doctors.flatMap((d) => d.languages))).sort();
const sorts = {
  rating: "Top rated",
  experience: "Most experienced",
  fee: "Lowest fee",
} as const;

export function DoctorDirectory() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const q = params.get("q") ?? "";
  const department = params.get("department") ?? "";
  const language = params.get("language") ?? "";
  const insurer = params.get("insurer") ?? "";
  const telehealth = params.get("telehealth") === "1";
  const sort = (params.get("sort") ?? "rating") as keyof typeof sorts;

  // The search box is uncontrolled so typing never lags behind the URL. When the URL changes
  // from outside (Clear filters, back/forward), copy it into the box.
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (searchRef.current && searchRef.current.value !== q) searchRef.current.value = q;
  }, [q]);

  function update(next: Record<string, string | null>) {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    router.replace(`${pathname}${p.size ? `?${p}` : ""}`, { scroll: false });
  }

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    return doctors
      .filter((d) => {
        if (department && d.department !== department) return false;
        if (language && !d.languages.includes(language)) return false;
        if (insurer && !d.insurers.includes(insurer)) return false;
        if (telehealth && !d.telehealth) return false;
        if (!term) return true;
        const dept = departmentsBySlug[d.department];
        const haystack = [d.name, d.title, dept?.name, ...(dept?.conditions ?? [])].join(" ").toLowerCase();
        return haystack.includes(term);
      })
      .sort((a, b) =>
        sort === "experience" ? b.experience - a.experience : sort === "fee" ? a.fee - b.fee : b.rating - a.rating || b.reviews - a.reviews,
      );
  }, [q, department, language, insurer, telehealth, sort]);

  const activeCount = [q.trim(), department, language, insurer, telehealth ? "1" : ""].filter(Boolean).length;

  return (
    <section className="container-page py-10">
      <div className="sticky top-16 z-20 -mx-4 bg-background/90 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-3xl sm:border sm:border-border sm:bg-surface/90 sm:p-4 sm:shadow-soft">
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
          <label className="relative">
            <span className="sr-only">Search doctors</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              ref={searchRef}
              type="search"
              defaultValue={q}
              onChange={(e) => update({ q: e.target.value || null })}
              placeholder="Name, specialty or condition"
              className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-4 text-sm focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15"
            />
          </label>
          <NativeSelect aria-label="Department" value={department} onChange={(e) => update({ department: e.target.value || null })}>
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.slug} value={d.slug}>{d.name}</option>
            ))}
          </NativeSelect>
          <NativeSelect aria-label="Language" value={language} onChange={(e) => update({ language: e.target.value || null })}>
            <option value="">Any language</option>
            {languages.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </NativeSelect>
          <NativeSelect aria-label="Insurance" value={insurer} onChange={(e) => update({ insurer: e.target.value || null })}>
            <option value="">Any insurance</option>
            {insurers.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </NativeSelect>
          <button
            type="button"
            aria-pressed={telehealth}
            onClick={() => update({ telehealth: telehealth ? null : "1" })}
            className={cn(
              "flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors",
              telehealth ? "border-brand-500 bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200" : "border-border bg-surface hover:border-brand-400",
            )}
          >
            <Video className="size-4" aria-hidden /> Video visits
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          <span className="font-bold text-foreground">{results.length}</span> {results.length === 1 ? "doctor" : "doctors"}
          {department && <> in <span className="font-semibold text-foreground">{departmentsBySlug[department]?.name}</span></>}
        </p>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <button
              type="button"
              onClick={() => update({ department: null, language: null, insurer: null, telehealth: null, q: null })}
              className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              <X className="size-4" aria-hidden /> Clear filters ({activeCount})
            </button>
          )}
          <label className="flex items-center gap-2 text-sm">
            <SlidersHorizontal className="size-4 text-muted-foreground" aria-hidden />
            <span className="sr-only">Sort by</span>
            <select
              value={sort}
              onChange={(e) => update({ sort: e.target.value === "rating" ? null : e.target.value })}
              className="rounded-md bg-transparent font-semibold"
            >
              {Object.entries(sorts).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {results.length ? (
        <motion.ul layout className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {results.map((d) => (
              <motion.li key={d.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.25 }}>
                <DoctorCard doctor={d} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      ) : (
        <div className="mt-10 flex flex-col items-center rounded-3xl border border-dashed border-border py-16 text-center">
          <Image src="/images/dashboard/empty-search.png" alt="" width={180} height={180} className="size-40" />
          <h2 className="mt-4 text-xl font-bold">No doctors match those filters</h2>
          <p className="mt-1 text-sm text-muted-foreground">Try another language or department, or clear the filters.</p>
        </div>
      )}
    </section>
  );
}
