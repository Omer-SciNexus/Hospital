"use client";

import { useState } from "react";
import { CircleCheck, Send } from "lucide-react";

export function NewsletterForm() {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p role="status" className="flex items-center gap-2 font-semibold text-white">
        <CircleCheck className="size-5 text-brand-400" aria-hidden /> Thanks! Check your inbox to confirm.
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setDone(true);
      }}
      className="flex w-full flex-col gap-2 sm:flex-row"
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        placeholder="you@example.com"
        className="h-12 flex-1 rounded-full border border-white/15 bg-white/10 px-5 text-sm text-white placeholder:text-brand-300 focus-visible:border-brand-400 focus-visible:outline-none"
      />
      <button
        type="submit"
        className="flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-brand-900 transition-colors hover:bg-brand-100"
      >
        Subscribe <Send className="size-4" aria-hidden />
      </button>
    </form>
  );
}
