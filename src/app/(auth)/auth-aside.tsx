"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";

const panels: Record<string, { image: string; title: string; text: string }> = {
  "/sign-in": {
    image: "/images/auth/signin.png",
    title: "Your care, all in one place.",
    text: "Appointments, results, orders and messages with your care team.",
  },
  "/sign-up": {
    image: "/images/auth/signup.png",
    title: "Care for the whole family.",
    text: "One account for you and the people you look after.",
  },
  "/forgot-password": {
    image: "/images/auth/forgot-password.png",
    title: "Let's get you back in.",
    text: "We'll send a secure reset link to your email.",
  },
  "/reset-password": {
    image: "/images/auth/forgot-password.png",
    title: "Almost there.",
    text: "Pick a new password and you're back in.",
  },
};

export function AuthAside() {
  const pathname = usePathname();
  const panel = panels[pathname] ?? panels["/sign-in"];
  return (
    <aside className="relative hidden overflow-hidden bg-brand-950 lg:block">
      <Image src={panel.image} alt="" fill priority sizes="46vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-950/90 via-brand-950/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-12 text-white">
        <h2 className="max-w-md text-4xl font-extrabold">{panel.title}</h2>
        <p className="mt-3 max-w-md text-lg text-brand-100">{panel.text}</p>
        <p className="mt-8 flex items-center gap-2 text-sm text-brand-200">
          <ShieldCheck className="size-4" aria-hidden /> Demo app: no real accounts or health data.
        </p>
      </div>
    </aside>
  );
}
