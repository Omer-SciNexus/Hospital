"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

export function CountUp({ value, decimals = 0, suffix = "" }: { value: number; decimals?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const format = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  // Starts at 0 on server and client alike (no hydration mismatch); reduced motion jumps to the value.
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, { duration: 1.6, ease: [0.2, 0.8, 0.2, 1], onUpdate: setDisplay });
    return () => controls.stop();
  }, [inView, reduce, value]);

  return (
    <span ref={ref} className="tabular-nums">
      <span aria-hidden>
        {format(display)}
        {suffix}
      </span>
      {/* Screen readers and the server HTML get the final number, not the animation. */}
      <span className="sr-only">
        {format(value)}
        {suffix}
      </span>
    </span>
  );
}
