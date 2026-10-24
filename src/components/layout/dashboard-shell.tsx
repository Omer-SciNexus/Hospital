"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DropdownMenu } from "radix-ui";
import { Check, ChevronsUpDown, LogOut, Menu, Siren } from "lucide-react";
import { dashboardNav, roles, type Role } from "@/config/navigation";
import { site } from "@/config/site";
import { useSession } from "@/store/session";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { CommandMenu } from "./command-menu";
import { useDashboardSignals } from "./dashboard-signals";
import { Logo } from "./logo";
import { NotificationsMenu } from "./notifications-menu";
import { ThemeToggle } from "./theme-toggle";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const role = useSession((s) => s.role);
  const router = useRouter();
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const signals = useDashboardSignals(role ?? "patient");

  useEffect(() => {
    if (hydrated && !role) router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`);
  }, [hydrated, role, router, pathname]);

  useEffect(() => setNavOpen(false), [pathname]);

  if (!hydrated || !role) {
    return <div className="grid min-h-dvh place-items-center text-sm text-muted-foreground">Loading your dashboard…</div>;
  }

  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-surface lg:flex">
        <SidebarContent role={role} pathname={pathname} badges={signals.badges} />
      </aside>

      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="left" className="w-72">
          <SheetTitle className="sr-only">Dashboard menu</SheetTitle>
          <SheetDescription className="sr-only">Dashboard navigation</SheetDescription>
          <SidebarContent role={role} pathname={pathname} badges={signals.badges} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur-xl sm:px-6">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className="grid size-10 place-items-center rounded-full hover:bg-muted lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <CommandMenu role={role} />
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <NotificationsMenu notices={signals.notices} />
            <RoleSwitcher role={role} />
          </div>
        </header>
        <main id="main" className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ role, pathname, badges }: { role: Role; pathname: string; badges: Record<string, number> }) {
  const items = dashboardNav[role];
  return (
    <>
      <div className="flex h-16 items-center border-b border-border px-5">
        <Logo />
      </div>
      <nav aria-label="Dashboard" className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
            // Live counts from the stores win over the static badge in config; 0 hides it.
            const live = badges[item.href];
            const badge = live === undefined ? item.badge : live > 0 ? String(live) : undefined;
            return (
              <li key={item.href + item.label}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon name={item.icon} className="size-[18px]" />
                  <span className="flex-1">{item.label}</span>
                  {badge && (
                    <span className="rounded-full bg-coral-700 px-1.5 py-px text-[11px] font-bold text-white tabular-nums">{badge}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="m-3 rounded-2xl bg-red-50 p-4 text-sm dark:bg-red-950/50">
        <p className="flex items-center gap-2 font-bold text-red-700 dark:text-red-200">
          <Siren className="size-4" aria-hidden /> Emergency
        </p>
        <p className="mt-1 text-red-700/80 dark:text-red-200/80">Call {site.emergencyPhone}. Chat is not monitored for emergencies.</p>
      </div>
    </>
  );
}

function RoleSwitcher({ role }: { role: Role }) {
  const router = useRouter();
  const signIn = useSession((s) => s.signIn);
  const signOut = useSession((s) => s.signOut);
  const profileName = useSession((s) => s.profile?.name);
  const current = roles.find((r) => r.id === role)!;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="ml-1 flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-muted">
        <span className="relative size-8 overflow-hidden rounded-full bg-brand-50">
          <Image src={current.avatar} alt="" fill sizes="64px" className="object-cover object-top" />
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-sm font-semibold">{profileName || current.person}</span>
          <span className="block text-xs text-muted-foreground">{current.label}</span>
        </span>
        <ChevronsUpDown className="size-4 text-muted-foreground" aria-hidden />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-64 animate-[menu-in_150ms_ease-out] rounded-2xl border border-border bg-surface p-1.5 shadow-lift"
        >
          <DropdownMenu.Label className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Switch demo role
          </DropdownMenu.Label>
          {roles.map((r) => (
            <DropdownMenu.Item
              key={r.id}
              onSelect={() => signIn(r.id)}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm outline-none data-[highlighted]:bg-muted"
            >
              <span className="flex-1">{r.label}</span>
              {r.id === role && <Check className="size-4 text-primary" aria-hidden />}
            </DropdownMenu.Item>
          ))}
          <DropdownMenu.Separator className="my-1.5 h-px bg-border" />
          <DropdownMenu.Item
            onSelect={() => {
              signOut();
              router.push("/");
            }}
            className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-600 outline-none data-[highlighted]:bg-red-50 dark:data-[highlighted]:bg-red-950"
          >
            <LogOut className="size-4" aria-hidden /> Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
