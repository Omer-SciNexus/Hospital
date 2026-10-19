"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { roles } from "@/config/navigation";
import { useSession } from "@/store/session";
import { safeNext } from "@/lib/utils";

export function RolePicker() {
  const router = useRouter();
  const params = useSearchParams();
  const signIn = useSession((s) => s.signIn);
  const signOut = useSession((s) => s.signOut);
  const next = params.get("next");

  return (
    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
      {roles.map((r) => (
        <li key={r.id}>
          <button
            type="button"
            onClick={() => {
              // Clear any email profile so the role's demo persona shows.
              signOut();
              signIn(r.id);
              router.push(safeNext(next));
            }}
            className="group flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-3 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-lift"
          >
            <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-brand-50">
              <Image src={r.avatar} alt="" fill sizes="96px" className="object-cover object-top" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{r.label}</span>
              <span className="block truncate text-xs text-muted-foreground">{r.description}</span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}
