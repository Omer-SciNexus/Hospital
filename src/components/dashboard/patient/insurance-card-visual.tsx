import { Star } from "lucide-react";
import { insurersById } from "@/data/insurers";
import type { InsuranceCard } from "@/store/insurance";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { InsurerLogo } from "@/components/marketing/insurer-logo";

/** Credit-card style picture of an insurance card, tinted with the insurer's color. */
export function InsuranceCardVisual({ card, className }: { card: InsuranceCard; className?: string }) {
  const insurer = insurersById[card.insurerId];
  const color = insurer?.color ?? "#0c6c6c";
  return (
    <div
      className={cn("relative aspect-[1.6/1] w-full overflow-hidden rounded-3xl p-5 text-white shadow-lift", className)}
      style={{ background: `linear-gradient(135deg, ${color} 0%, #0f2a2e 120%)` }}
    >
      <span className="pointer-events-none absolute -right-10 -top-14 size-48 rounded-full bg-white/10" aria-hidden />
      <span className="pointer-events-none absolute -bottom-20 -left-6 size-48 rounded-full bg-white/5" aria-hidden />
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-2">
          {insurer && (
            <span className="rounded-2xl bg-white/95 px-2 py-1.5 text-[#0f2a2e]">
              <InsurerLogo insurer={insurer} className="text-sm" />
            </span>
          )}
          <div className="flex flex-col items-end gap-1">
            <StatusBadge status={card.status} className="ring-1 ring-white/40" />
            {card.primary && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold ring-1 ring-white/25">
                <Star className="size-3 fill-current" aria-hidden /> Primary
              </span>
            )}
          </div>
        </div>
        <div className="mt-auto">
          <p className="text-[11px] uppercase tracking-widest text-white/70">Member ID</p>
          <p className="font-mono text-lg font-semibold tracking-wider sm:text-xl">{card.memberId}</p>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs">
            <p>
              <span className="block text-white/70">Holder</span>
              <span className="font-semibold">{card.holder}</span>
            </p>
            <p>
              <span className="block text-white/70">Plan</span>
              <span className="font-semibold">{card.plan}</span>
            </p>
            <p>
              <span className="block text-white/70">Group</span>
              <span className="font-semibold">{card.groupNumber}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
