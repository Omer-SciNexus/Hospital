import Link from "next/link";
import { Clock, MapPin, Phone, Siren } from "lucide-react";
import { site } from "@/config/site";

export function TopBar() {
  return (
    <div className="bg-brand-950 text-brand-50">
      <div className="container-page flex h-10 items-center justify-between gap-4 text-xs">
        <Link
          href="/emergency"
          className="flex items-center gap-2 font-semibold text-white transition-colors hover:text-coral-100"
        >
          <span className="relative grid size-5 place-items-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-red-500/50" />
            <Siren className="relative size-3.5 text-red-400" aria-hidden />
          </span>
          <span>
            Emergency 24/7: <span className="tabular-nums">{site.emergencyPhone}</span>
          </span>
        </Link>
        <div className="hidden items-center gap-6 text-brand-200 md:flex">
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden /> Outpatient {site.hours.outpatient}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="size-3.5" aria-hidden /> {site.address.line1}, {site.address.city}
          </span>
          <a href={`tel:${site.phone}`} className="flex items-center gap-1.5 hover:text-white">
            <Phone className="size-3.5" aria-hidden /> {site.phone}
          </a>
        </div>
      </div>
    </div>
  );
}
