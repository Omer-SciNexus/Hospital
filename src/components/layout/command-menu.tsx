"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import { CornerDownLeft, Search, Stethoscope, ShoppingBag, UserRound } from "lucide-react";
import { dashboardNav, type Role } from "@/config/navigation";
import { doctors } from "@/data/doctors";
import { patients } from "@/data/patients";
import { products } from "@/data/products";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

interface Result {
  id: string;
  group: string;
  label: string;
  hint?: string;
  href: string;
  icon: React.ReactNode;
}

/** Where a patient search result leads for each staff role. */
const patientHref: Record<Role, (id: string) => string> = {
  patient: () => "/dashboard",
  doctor: (id) => `/dashboard/patients/${id}`,
  nurse: (id) => `/dashboard/patients/${id}`,
  admin: () => "/dashboard/analytics",
  pharmacist: () => "/dashboard/rx-queue",
  billing: () => "/dashboard/claims",
};

/** Ctrl/⌘ K search across this role's screens, patients (staff only), doctors and products. */
export function CommandMenu({ role }: { role: Role }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    const match = (...fields: string[]) => !q || fields.some((f) => f.toLowerCase().includes(q));
    const pages: Result[] = dashboardNav[role]
      .filter((n) => match(n.label))
      .map((n) => ({ id: `nav-${n.href}`, group: "Go to", label: n.label, href: n.href, icon: <Icon name={n.icon} className="size-4" /> }));
    const people: Result[] =
      role === "patient" || !q
        ? []
        : patients
            .filter((p) => match(p.name, p.mrn, p.condition))
            .slice(0, 5)
            .map((p) => ({
              id: `pt-${p.id}`,
              group: "Patients",
              label: p.name,
              hint: `${p.mrn} · ${p.condition}`,
              href: patientHref[role](p.id),
              icon: <UserRound className="size-4" aria-hidden />,
            }));
    const docs: Result[] = !q
      ? []
      : doctors
          .filter((d) => match(d.name, d.title, d.department))
          .slice(0, 4)
          .map((d) => ({ id: `dr-${d.id}`, group: "Doctors", label: d.name, hint: d.title, href: `/doctors/${d.id}`, icon: <Stethoscope className="size-4" aria-hidden /> }));
    const shop: Result[] = !q
      ? []
      : products
          .filter((p) => match(p.name, p.brand, p.category))
          .slice(0, 4)
          .map((p) => ({ id: `pr-${p.id}`, group: "Marketplace", label: p.name, hint: p.brand, href: `/marketplace/${p.id}`, icon: <ShoppingBag className="size-4" aria-hidden /> }));
    return [...pages, ...people, ...docs, ...shop];
  }, [query, role]);

  function go(r: Result | undefined) {
    if (!r) return;
    setOpen(false);
    setQuery("");
    router.push(r.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = (active + (e.key === "ArrowDown" ? 1 : -1) + results.length) % Math.max(1, results.length);
      setActive(next);
      listRef.current?.querySelector(`[data-index="${next}"]`)?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    }
  }

  let lastGroup = "";

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setQuery("");
      }}
    >
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          className="hidden h-10 max-w-md flex-1 items-center gap-2 rounded-full border border-border bg-background pl-3.5 pr-2 text-sm text-muted-foreground transition-colors hover:border-brand-400 sm:flex"
        >
          <Search className="size-4" aria-hidden />
          <span className="flex-1 text-left">Search screens, patients, products…</span>
          <kbd className="rounded-md border border-border bg-surface px-1.5 py-0.5 font-sans text-[11px] font-semibold">Ctrl K</kbd>
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-brand-950/50 backdrop-blur-sm data-[state=open]:animate-[fade-in_150ms_ease-out]" />
        <DialogPrimitive.Content
          onKeyDown={onKeyDown}
          className="fixed left-1/2 top-[12vh] z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-3xl border border-border bg-surface shadow-lift outline-none data-[state=open]:animate-[menu-in_180ms_ease-out]"
        >
          <DialogPrimitive.Title className="sr-only">Search</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">Type to search, use arrow keys to move and Enter to open.</DialogPrimitive.Description>
          <div className="flex items-center gap-3 border-b border-border px-5">
            <Search className="size-5 text-muted-foreground" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              placeholder="Search screens, patients, doctors, products…"
              aria-label="Search"
              role="combobox"
              aria-expanded
              aria-controls="command-results"
              aria-activedescendant={results[active] ? `cmd-${results[active].id}` : undefined}
              className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ul ref={listRef} id="command-results" role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
            {results.length === 0 && <li className="px-4 py-10 text-center text-sm text-muted-foreground">No results for “{query}”.</li>}
            {results.map((r, i) => {
              const header = r.group !== lastGroup ? r.group : null;
              lastGroup = r.group;
              return (
                <li key={r.id} role="presentation">
                  {header && <p className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{header}</p>}
                  <div
                    id={`cmd-${r.id}`}
                    role="option"
                    aria-selected={i === active}
                    data-index={i}
                    onMouseMove={() => setActive(i)}
                    onClick={() => go(r)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
                      i === active ? "bg-brand-50 text-brand-900 dark:bg-brand-950 dark:text-brand-100" : "text-foreground",
                    )}
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">{r.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{r.label}</span>
                      {r.hint && <span className="block truncate text-xs text-muted-foreground">{r.hint}</span>}
                    </span>
                    {i === active && <CornerDownLeft className="size-4 text-muted-foreground" aria-hidden />}
                  </div>
                </li>
              );
            })}
          </ul>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
