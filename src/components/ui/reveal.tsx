"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

/**
 * Fades and lifts children into view once when scrolled into the viewport. Use `as="li"` inside lists.
 * Reduced motion is handled by `<MotionConfig reducedMotion="user">` in providers (no lift, fade only),
 * so server and client render the same markup.
 */
export function Reveal({
  delay = 0,
  y = 24,
  as = "div",
  ...props
}: HTMLMotionProps<"div"> & { delay?: number; y?: number; as?: "div" | "li" }) {
  const Cmp = (as === "li" ? motion.li : motion.div) as typeof motion.div;
  return (
    <Cmp
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.2, 0.8, 0.2, 1] }}
      {...props}
    />
  );
}
