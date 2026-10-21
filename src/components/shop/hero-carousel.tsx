"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const slides = [
  { img: "banner-flash-sale", eyebrow: "Flash sale", title: "Up to 30% off health devices", text: "Monitors, meters and thermometers, only this week.", cta: "Shop the sale", href: "/marketplace?tag=deal#catalog", tint: "from-coral-700/95 via-coral-700/70" },
  { img: "banner-checkup", eyebrow: "Health packages", title: "A full check-up, done in one morning", text: "86 tests with a doctor review, from $199.", cta: "See packages", href: "/marketplace?category=health-packages#catalog", tint: "from-brand-950/95 via-brand-950/70" },
  { img: "banner-home-lab", eyebrow: "Home lab", title: "We take the sample at your door", text: "Book a slot, a nurse comes to you. Results in your portal.", cta: "Book a lab test", href: "/marketplace?category=lab-tests#catalog", tint: "from-blue-950/95 via-blue-950/70" },
  { img: "banner-pharmacy", eyebrow: "Pharmacy", title: "Upload your Rx, get it today", text: "A pharmacist checks every prescription before it ships.", cta: "Go to pharmacy", href: "/marketplace?category=pharmacy#catalog", tint: "from-emerald-950/95 via-emerald-950/70" },
  { img: "banner-telemedicine", eyebrow: "Video visits", title: "See a specialist from your sofa", text: "Cardiology, skin, kids and mental health, from $60.", cta: "Book a video visit", href: "/marketplace?category=consultations#catalog", tint: "from-indigo-950/95 via-indigo-950/70" },
  { img: "banner-devices", eyebrow: "Mobility", title: "Rent a wheelchair by the week", text: "Walkers, crutches and hospital beds, delivered and set up.", cta: "Rent mobility aids", href: "/marketplace?rent=1#catalog", tint: "from-slate-950/95 via-slate-950/70" },
  { img: "banner-wellness", eyebrow: "Wellness", title: "Small habits, big difference", text: "Vitamins, sleep and fitness picks from our dietitians.", cta: "Shop wellness", href: "/marketplace?category=wellness#catalog", tint: "from-green-950/95 via-green-950/70" },
];

const DELAY = 6000;

/** Auto-playing banner carousel. Pauses on hover, focus or the pause button; no auto-play with reduced motion. */
export function HeroCarousel() {
  const reduce = useReducedMotion();
  const hydrated = useHydrated();
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [hovered, setHovered] = useState(false);
  const [paused, setPaused] = useState(false);
  const playing = hydrated && !reduce && !paused && !hovered;

  const go = useCallback((next: number, direction = 1) => {
    setDir(direction);
    setIndex((next + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => go(index + 1, 1), DELAY);
    return () => clearTimeout(id);
  }, [playing, index, go]);

  const s = slides[index];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Marketplace offers"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1, 1);
        if (e.key === "ArrowLeft") go(index - 1, -1);
      }}
      className="relative isolate h-[420px] overflow-hidden rounded-3xl bg-brand-950 sm:h-[440px]"
    >
      <AnimatePresence initial={false} custom={dir} mode="popLayout">
        <motion.div
          key={s.img}
          custom={dir}
          role="group"
          aria-roledescription="slide"
          aria-label={`${index + 1} of ${slides.length}: ${s.eyebrow}`}
          initial={{ opacity: 0, x: dir * 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir * -60 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          className="absolute inset-0"
        >
          <Image
            src={`/images/marketplace/banners/${s.img}.png`}
            alt=""
            fill
            priority={index === 0}
            sizes="(min-width: 1280px) 1216px, 100vw"
            className="-z-10 object-cover object-[75%_center]"
          />
          <div className={cn("absolute inset-0 -z-10 bg-gradient-to-r to-transparent max-sm:to-black/30", s.tint)} />
          <div className="flex h-full max-w-xl flex-col justify-center px-6 pb-10 text-white sm:px-12">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider ring-1 ring-white/25 backdrop-blur"
            >
              {s.eyebrow}
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              className="mt-4 text-3xl font-extrabold leading-tight sm:text-5xl"
            >
              {s.title}
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-3 text-base text-white/90 sm:text-lg">
              {s.text}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }} className="mt-6">
              <Button asChild variant="white" size="lg">
                <Link href={s.href}>
                  {s.cta} <ArrowRight aria-hidden />
                </Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-x-0 bottom-4 flex items-center justify-between gap-3 px-4 sm:px-8">
        <div className="flex items-center gap-1.5">
          {slides.map((sl, i) => (
            <button
              key={sl.img}
              type="button"
              onClick={() => go(i, i > index ? 1 : -1)}
              aria-label={`Show slide ${i + 1}: ${sl.eyebrow}`}
              aria-current={i === index}
              className="group grid h-6 place-items-center"
            >
              <span className={cn("block h-1.5 overflow-hidden rounded-full bg-white/40 transition-all duration-300", i === index ? "w-8" : "w-1.5 group-hover:bg-white/70")}>
                {i === index && (
                  <motion.span
                    key={`${index}-${playing}`}
                    className="block h-full bg-white"
                    initial={{ width: playing ? "0%" : "100%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: playing ? DELAY / 1000 : 0, ease: "linear" }}
                  />
                )}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Play slides" : "Pause slides"}
            className="grid size-9 place-items-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur transition-colors hover:bg-white/25 motion-reduce:hidden"
          >
            {paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
          </button>
          <button
            type="button"
            onClick={() => go(index - 1, -1)}
            aria-label="Previous slide"
            className="grid size-9 place-items-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur transition-colors hover:bg-white/25"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1, 1)}
            aria-label="Next slide"
            className="grid size-9 place-items-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur transition-colors hover:bg-white/25"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
