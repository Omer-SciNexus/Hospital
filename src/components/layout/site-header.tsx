"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ChevronDown, LayoutDashboard, ShoppingBag, UserRound } from "lucide-react";
import { mainNav } from "@/config/navigation";
import { useCart, selectCartCount } from "@/store/cart";
import { useSession } from "@/store/session";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { MegaMenu } from "./mega-menu";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMegaOpen(false), [pathname]);

  useEffect(() => {
    if (!megaOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMegaOpen(false);
    const onClick = (e: MouseEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setMegaOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [megaOpen]);

  const openSoon = () => {
    clearTimeout(closeTimer.current);
    setMegaOpen(true);
  };
  const closeSoon = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMegaOpen(false), 160);
  };

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      ref={headerRef}
      className={cn(
        "sticky top-0 z-40 transition-[background-color,box-shadow,border-color] duration-300",
        scrolled || megaOpen
          ? "border-b border-border bg-surface/85 shadow-soft backdrop-blur-xl"
          : "border-b border-transparent bg-background/60 backdrop-blur",
      )}
    >
      <div className={cn("container-page flex items-center gap-6 transition-[height] duration-300", scrolled ? "h-16" : "h-20")}>
        <Logo />

        <nav aria-label="Main" className="hidden flex-1 items-center justify-center lg:flex">
          <ul className="flex items-center gap-1">
            {mainNav.map((item) =>
              "mega" in item ? (
                <li key={item.href} onMouseEnter={openSoon} onMouseLeave={closeSoon}>
                  <button
                    type="button"
                    aria-expanded={megaOpen}
                    aria-controls="mega-menu"
                    onClick={() => setMegaOpen((o) => !o)}
                    className={cn(
                      "flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors hover:text-primary",
                      (megaOpen || isActive(item.href)) && "text-primary",
                    )}
                  >
                    {item.label}
                    <ChevronDown className={cn("size-4 transition-transform duration-200", megaOpen && "rotate-180")} aria-hidden />
                  </button>
                </li>
              ) : (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors hover:text-primary",
                      isActive(item.href) && "text-primary",
                    )}
                    aria-current={isActive(item.href) ? "page" : undefined}
                  >
                    {item.label}
                    {"highlight" in item && (
                      <span className="rounded-full bg-coral-700 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-white">
                        New
                      </span>
                    )}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <ThemeToggle className="hidden sm:grid" />
          <CartButton />
          <AccountButton />
          <Button asChild size="sm" className="ml-2 hidden md:inline-flex">
            <Link href="/doctors">
              <CalendarDays aria-hidden /> Book visit
            </Link>
          </Button>
          <MobileNav />
        </div>
      </div>

      {megaOpen && (
        <div
          id="mega-menu"
          className="absolute inset-x-0 top-full hidden pt-2 lg:block"
          onMouseEnter={openSoon}
          onMouseLeave={closeSoon}
        >
          <MegaMenu onNavigate={() => setMegaOpen(false)} />
        </div>
      )}
    </header>
  );
}

function CartButton() {
  const hydrated = useHydrated();
  const count = useCart(selectCartCount);
  const setOpen = useCart((s) => s.setOpen);
  const shown = hydrated ? count : 0;
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-haspopup="dialog"
      aria-label={shown ? `Open cart, ${shown} items` : "Open cart"}
      className="relative grid size-10 place-items-center rounded-full transition-colors hover:bg-muted"
    >
      <ShoppingBag className="size-[18px]" aria-hidden />
      {shown > 0 && (
        <span className="absolute right-0.5 top-0.5 grid min-w-4.5 place-items-center rounded-full bg-coral-700 px-1 text-[10px] font-bold text-white tabular-nums">
          {shown}
        </span>
      )}
    </button>
  );
}

function AccountButton() {
  const hydrated = useHydrated();
  const role = useSession((s) => s.role);
  const signedIn = hydrated && role;
  return (
    <Link
      href={signedIn ? "/dashboard" : "/sign-in"}
      aria-label={signedIn ? "Dashboard" : "Sign in"}
      className="hidden h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold transition-colors hover:bg-muted sm:flex"
    >
      {signedIn ? <LayoutDashboard className="size-[18px]" aria-hidden /> : <UserRound className="size-[18px]" aria-hidden />}
      <span className="hidden xl:inline">{signedIn ? "Dashboard" : "Sign in"}</span>
    </Link>
  );
}
