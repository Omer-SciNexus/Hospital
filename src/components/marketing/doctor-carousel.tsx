"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Doctor } from "@/data/doctors";
import { DoctorCard } from "./doctor-card";

export function DoctorCarousel({ doctors }: { doctors: Doctor[] }) {
  const ref = useRef<HTMLUListElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div className="mb-6 flex justify-end gap-2">
        <button type="button" onClick={() => scroll(-1)} aria-label="Previous doctors" className="grid size-11 place-items-center rounded-full border border-border bg-surface transition-colors hover:border-brand-400 hover:text-primary">
          <ChevronLeft className="size-5" />
        </button>
        <button type="button" onClick={() => scroll(1)} aria-label="Next doctors" className="grid size-11 place-items-center rounded-full border border-border bg-surface transition-colors hover:border-brand-400 hover:text-primary">
          <ChevronRight className="size-5" />
        </button>
      </div>
      <ul ref={ref} className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-4 px-4 pb-4">
        {doctors.map((d) => (
          <li key={d.id} className="w-[78%] shrink-0 snap-start min-[480px]:w-[46%] md:w-[31%] lg:w-[23.5%]">
            <DoctorCard doctor={d} />
          </li>
        ))}
      </ul>
    </div>
  );
}
