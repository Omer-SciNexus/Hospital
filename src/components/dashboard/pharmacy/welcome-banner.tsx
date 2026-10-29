"use client";

import Image from "next/image";
import { roles, type Role } from "@/config/navigation";
import { useSession } from "@/store/session";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

/** Gradient greeting banner shared by the pharmacist and billing overviews. */
export function WelcomeBanner({ role, summary, children }: { role: Role; summary: React.ReactNode; children?: React.ReactNode }) {
  const profile = useSession((s) => s.profile);
  const persona = roles.find((r) => r.id === role)!;
  const name = (profile?.name || persona.person).split(" ")[0];

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-blue-700 p-6 text-white sm:p-8">
      <div className="relative z-10 max-w-xl md:pr-48">
        <p className="text-sm font-semibold text-brand-100">{persona.label} · {new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date())}</p>
        <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
          {greeting()}, {name}.
        </h1>
        <p className="mt-2 text-brand-50">{summary}</p>
        {children && <div className="mt-5 flex flex-wrap gap-2">{children}</div>}
      </div>
      <Image src="/images/dashboard/welcome.png" alt="" width={240} height={240} priority className="absolute -bottom-6 right-4 hidden size-52 md:block" />
    </section>
  );
}
