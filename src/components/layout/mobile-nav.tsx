"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Menu, Siren, UserRound } from "lucide-react";
import { mainNav } from "@/config/navigation";
import { departmentGroups, departmentIcon, departmentsInGroup } from "@/config/departments";
import { site } from "@/config/site";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="grid size-10 place-items-center rounded-full transition-colors hover:bg-muted lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="right">
        <div className="flex h-20 items-center border-b border-border px-5">
          <Logo />
        </div>
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">Site navigation</SheetDescription>

        <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 py-3">
          <Accordion type="single" collapsible>
            <AccordionItem value="departments">
              <AccordionTrigger className="py-3.5 text-base">Departments</AccordionTrigger>
              <AccordionContent className="space-y-5 text-foreground">
                {departmentGroups.map((group) => (
                  <div key={group.id}>
                    <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">{group.name}</p>
                    <ul className="grid grid-cols-1 gap-0.5">
                      {departmentsInGroup(group.id).map((d) => (
                        <li key={d.slug}>
                          <Link
                            href={`/departments/${d.slug}`}
                            onClick={close}
                            className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-sm font-medium hover:bg-muted"
                          >
                            <Image src={departmentIcon(d.slug)} alt="" width={24} height={24} className="size-6" />
                            {d.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <Link href="/departments" onClick={close} className="block text-sm font-semibold text-primary">
                  View all departments →
                </Link>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <ul>
            {mainNav
              .filter((item) => !("mega" in item))
              .map((item) => (
                <li key={item.href} className="border-b border-border last:border-0">
                  <Link href={item.href} onClick={close} className="flex items-center gap-2 py-3.5 text-base font-semibold">
                    {item.label}
                    {"highlight" in item && (
                      <span className="rounded-full bg-coral-700 px-1.5 py-px text-[10px] font-bold uppercase text-white">New</span>
                    )}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>

        <div className="space-y-3 border-t border-border p-5">
          <Button asChild className="w-full">
            <Link href="/doctors" onClick={close}>
              <CalendarDays aria-hidden /> Book a visit
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/sign-in" onClick={close}>
                <UserRound aria-hidden /> Sign in
              </Link>
            </Button>
            <ThemeToggle className="border border-border" />
          </div>
          <a
            href={`tel:${site.emergencyPhone}`}
            className="flex items-center justify-center gap-2 rounded-full bg-red-50 py-2.5 text-sm font-bold text-red-700 dark:bg-red-950 dark:text-red-200"
          >
            <Siren className="size-4" aria-hidden /> Emergency {site.emergencyPhone}
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
