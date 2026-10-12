import Link from "next/link";
import { Mail, MapPin, Phone, Siren } from "lucide-react";
import { footerNav } from "@/config/navigation";
import { departments } from "@/config/departments";
import { site } from "@/config/site";
import { Logo } from "./logo";
import { NewsletterForm } from "./newsletter-form";

export function SiteFooter() {
  const featured = departments.filter((d) => d.featured).slice(0, 6);
  return (
    <footer className="relative mt-24 overflow-hidden bg-brand-950 text-brand-100">
      <div className="pointer-events-none absolute -right-40 -top-40 size-[32rem] rounded-full bg-brand-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -left-24 size-[28rem] rounded-full bg-blue-600/20 blur-3xl" />

      <div className="container-page relative">
        <div className="grid gap-8 border-b border-white/10 py-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <h2 className="text-2xl font-extrabold text-white sm:text-3xl">Health tips, once a month.</h2>
            <p className="mt-2 text-brand-200">Seasonal advice from our doctors and early access to health package offers. No spam.</p>
          </div>
          <NewsletterForm />
        </div>

        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="space-y-5">
            <Logo inverted />
            <p className="max-w-xs text-sm text-brand-200">{site.description}</p>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand-400" aria-hidden />
                {site.address.line1}, {site.address.city}, {site.address.region} {site.address.postal}
              </li>
              <li>
                <a href={`tel:${site.phone}`} className="flex items-center gap-2.5 hover:text-white">
                  <Phone className="size-4 text-brand-400" aria-hidden /> {site.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${site.email}`} className="flex items-center gap-2.5 hover:text-white">
                  <Mail className="size-4 text-brand-400" aria-hidden /> {site.email}
                </a>
              </li>
            </ul>
          </div>

          {footerNav.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 text-sm font-bold text-white">{col.title}</h3>
              <ul className="space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-brand-200 transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="mb-4 text-sm font-bold text-white">Top departments</h3>
            <ul className="space-y-2.5 text-sm">
              {featured.map((d) => (
                <li key={d.slug}>
                  <Link href={`/departments/${d.slug}`} className="text-brand-200 transition-colors hover:text-white">
                    {d.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mb-8 flex flex-col items-start justify-between gap-4 rounded-2xl bg-red-500/10 p-5 ring-1 ring-red-400/20 sm:flex-row sm:items-center">
          <p className="flex items-center gap-3 text-sm text-red-100">
            <Siren className="size-5 shrink-0 text-red-400" aria-hidden />
            In a medical emergency, call {site.emergencyShort} or {site.emergencyPhone}. Don&apos;t use online chat or booking.
          </p>
          <Link href="/emergency" className="text-sm font-semibold text-white underline-offset-4 hover:underline">
            Emergency info →
          </Link>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 py-6 text-xs text-brand-300 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {site.name}. A demo project: names, people and numbers are made up.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {site.social.map((s) => (
              <a key={s.label} href={s.href} className="hover:text-white">
                {s.label}
              </a>
            ))}
            <Link href="/contact" className="hover:text-white">Privacy</Link>
            <Link href="/contact" className="hover:text-white">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
