"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowLeft, FileText, ImageIcon, Search, X } from "lucide-react";
import type { Role } from "@/config/navigation";
import type { ChatAttachment } from "@/data/chat";
import { patientsById } from "@/data/patients";
import type { Presence } from "@/data/staff";
import { cn } from "@/lib/utils";
import { useSession } from "@/store/session";
import { PageHeader } from "@/components/dashboard/page-header";
import { MENTION_RE, dayLabel, formatSize } from "./lib";

/**
 * Page frame for a chat screen: fills the viewport under the 64px header
 * (main padding is 1rem / 1.5rem / 2rem per side) so only the panes scroll.
 */
export function ChatFrame({
  title,
  description,
  eyebrow,
  actions,
  hideHeaderOnMobile,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  eyebrow?: string;
  actions?: React.ReactNode;
  hideHeaderOnMobile?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[calc(100dvh-6rem)] min-h-[28rem] flex-col sm:h-[calc(100dvh-7rem)] lg:h-[calc(100dvh-8rem)]">
      <PageHeader
        title={title}
        eyebrow={eyebrow}
        description={description}
        actions={actions}
        className={cn("mb-4 sm:mb-4 md:items-center", hideHeaderOnMobile && "hidden md:flex")}
      />
      {children}
    </div>
  );
}

/** Two panes: list on the left, conversation on the right. One pane at a time below md. */
export function PaneLayout({ list, conversation, showConversation }: { list: React.ReactNode; conversation: React.ReactNode; showConversation: boolean }) {
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
      <aside
        className={cn(
          "min-h-0 w-full flex-col border-border md:flex md:w-72 md:shrink-0 md:border-r lg:w-80",
          showConversation ? "hidden" : "flex",
        )}
      >
        {list}
      </aside>
      <section className={cn("min-h-0 min-w-0 flex-1 flex-col", showConversation ? "flex" : "hidden md:flex")}>{conversation}</section>
    </div>
  );
}

export function ListSearch({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        className="h-10 w-full rounded-full border border-border bg-background pl-9 pr-4 text-sm focus-visible:border-brand-500 focus-visible:outline-none"
      />
    </label>
  );
}

export function BackButton({ onClick, label = "Back to list" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick} className="-ml-1 grid size-9 shrink-0 place-items-center rounded-full hover:bg-muted md:hidden" aria-label={label}>
      <ArrowLeft className="size-5" aria-hidden />
    </button>
  );
}

export function UnreadBadge({ count, urgent }: { count: number; urgent?: boolean }) {
  if (!count) return null;
  return (
    <span
      className={cn(
        "grid min-w-5 place-items-center rounded-full px-1.5 py-px text-[11px] font-bold tabular-nums text-white",
        urgent ? "bg-red-600" : "bg-coral-600",
      )}
    >
      <span className="sr-only">{count} unread</span>
      <span aria-hidden>{count > 99 ? "99+" : count}</span>
    </span>
  );
}

const presenceColor: Record<Presence, string> = {
  online: "bg-green-500",
  busy: "bg-red-500",
  away: "bg-amber-400",
  offline: "bg-gray-400",
};

export function PresenceDot({ presence, className }: { presence: Presence; className?: string }) {
  return (
    <span className={cn("block size-3 rounded-full ring-2 ring-surface", presenceColor[presence], className)} title={presence}>
      <span className="sr-only">{presence}</span>
    </span>
  );
}

export function DaySeparator({ iso }: { iso: string }) {
  return (
    <div className="my-4 flex items-center gap-3 text-xs font-semibold text-muted-foreground" role="separator" aria-label={dayLabel(iso)}>
      <span className="h-px flex-1 bg-border" />
      {dayLabel(iso)}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 px-1 py-2 text-xs text-muted-foreground" aria-live="polite">
      <span className="flex gap-1 rounded-full bg-muted px-3 py-2" aria-hidden>
        {[0, 150, 300].map((d) => (
          <span key={d} className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70" style={{ animationDelay: `${d}ms` }} />
        ))}
      </span>
      {name} is typing…
    </div>
  );
}

/**
 * Scrolling message area. Sticks to the bottom while the reader is at the
 * bottom; otherwise shows a "Jump to latest" button. When `sentKey` changes
 * (the current user sent something) it always scrolls to the bottom.
 * Remount (key) per conversation.
 */
export function MessageLog({
  label,
  changeKey,
  sentKey,
  children,
  className,
}: {
  label: string;
  changeKey: unknown;
  sentKey?: unknown;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const lastSent = useRef(sentKey);
  const [showJump, setShowJump] = useState(false);

  const toBottom = useCallback((smooth = false) => {
    const el = ref.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  useLayoutEffect(() => {
    const sent = sentKey !== lastSent.current;
    lastSent.current = sentKey;
    if (sent) atBottom.current = true;
    if (atBottom.current) toBottom();
  }, [changeKey, sentKey, toBottom]);

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={ref}
        role="log"
        aria-live="polite"
        aria-label={label}
        tabIndex={0}
        onScroll={(e) => {
          const el = e.currentTarget;
          const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
          atBottom.current = bottom;
          setShowJump(!bottom);
        }}
        className={cn("h-full overflow-y-auto px-3 py-2 focus-visible:outline-none sm:px-5", className)}
      >
        {children}
      </div>
      {showJump && (
        <button
          type="button"
          onClick={() => toBottom(true)}
          className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold shadow-lift ring-1 ring-border"
        >
          <ArrowDown className="size-3.5" aria-hidden /> Jump to latest
        </button>
      )}
    </div>
  );
}

/** Roles that may open a patient chart (see dashboard/patients/[id]). */
const CHART_ROLES: Role[] = ["doctor", "nurse"];

/** Patient chip used for @mentions: "Ahmed Saleh · AUR-187430". Links to the chart for clinical roles only. */
export function PatientChip({ patientId, onDark }: { patientId: string; onDark?: boolean }) {
  const role = useSession((s) => s.role);
  const p = patientsById[patientId];
  if (!p) return <span>@patient</span>;
  const className = cn(
    "mx-0.5 inline-flex items-center gap-1 rounded-full px-2 py-px align-baseline text-[0.8125rem] font-semibold no-underline",
    onDark ? "bg-white text-blue-800" : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200",
  );
  if (!role || !CHART_ROLES.includes(role)) {
    return (
      <span className={className}>
        {p.name} · {p.mrn}
      </span>
    );
  }
  return (
    <Link href={`/dashboard/patients/${p.id}`} className={cn(className, "hover:underline")}>
      {p.name} · {p.mrn}
    </Link>
  );
}

function highlight(text: string, query?: string) {
  if (!query) return text;
  const q = query.toLowerCase();
  const out: React.ReactNode[] = [];
  let rest = text;
  let i = rest.toLowerCase().indexOf(q);
  let k = 0;
  while (i >= 0 && q) {
    out.push(rest.slice(0, i), <mark key={k++} className="rounded bg-amber-200 px-0.5 text-amber-950">{rest.slice(i, i + q.length)}</mark>);
    rest = rest.slice(i + q.length);
    i = rest.toLowerCase().indexOf(q);
  }
  out.push(rest);
  return out;
}

/** Message text with patient mention chips and optional search highlight. */
export function RichText({ body, query, onDark }: { body: string; query?: string; onDark?: boolean }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of body.matchAll(MENTION_RE)) {
    const idx = match.index ?? 0;
    parts.push(<span key={`t${idx}`}>{highlight(body.slice(last, idx), query)}</span>);
    parts.push(<PatientChip key={`m${idx}`} patientId={match[1]} onDark={onDark} />);
    last = idx + match[0].length;
  }
  parts.push(<span key="end">{highlight(body.slice(last), query)}</span>);
  return <p className="whitespace-pre-wrap break-words">{parts}</p>;
}

/** File chips; images picked this session show a preview. */
export function AttachmentList({ items, onDark, onRemove }: { items: ChatAttachment[]; onDark?: boolean; onRemove?: (i: number) => void }) {
  return (
    <ul className="mt-1.5 flex flex-wrap gap-1.5">
      {items.map((a, i) => (
        <li key={a.name + i}>
          <AttachmentChip item={a} onDark={onDark} onRemove={onRemove ? () => onRemove(i) : undefined} />
        </li>
      ))}
    </ul>
  );
}

function AttachmentChip({ item, onDark, onRemove }: { item: ChatAttachment; onDark?: boolean; onRemove?: () => void }) {
  const [broken, setBroken] = useState(false);
  const Icon = item.kind === "image" ? ImageIcon : FileText;
  return (
    <span
      className={cn(
        "inline-flex max-w-full flex-col overflow-hidden rounded-xl text-xs",
        onDark ? "bg-white/15 text-current ring-1 ring-white/25" : "bg-surface text-foreground ring-1 ring-border",
      )}
    >
      {item.kind === "image" && item.url && !broken && (
        <Image
          src={item.url}
          alt={`Attached image ${item.name}`}
          width={220}
          height={150}
          unoptimized
          onError={() => setBroken(true)}
          className="h-36 w-56 object-cover"
        />
      )}
      <span className="flex items-center gap-1.5 px-2.5 py-1.5">
        <Icon className="size-3.5 shrink-0" aria-hidden />
        <span className="max-w-40 truncate font-semibold">{item.name}</span>
        <span className="opacity-70">{formatSize(item.size)}</span>
        {onRemove && (
          <button type="button" onClick={onRemove} className="-mr-1 grid size-5 place-items-center rounded-full hover:bg-muted" aria-label={`Remove ${item.name}`}>
            <X className="size-3" aria-hidden />
          </button>
        )}
      </span>
    </span>
  );
}

/** Small round avatar with optional presence dot. */
export function ChatAvatar({ name, src, size = 36, presence }: { name: string; src?: string; size?: number; presence?: Presence }) {
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <span
        className="relative grid size-full place-items-center overflow-hidden rounded-full bg-brand-50 font-display font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-200"
        style={{ fontSize: size * 0.36 }}
      >
        {src ? (
          <Image src={src} alt="" fill sizes={`${size * 2}px`} className="object-cover object-top" />
        ) : (
          name
            .replace(/^(Dr\.?)\s+/i, "")
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase())
            .join("")
        )}
      </span>
      {presence && <PresenceDot presence={presence} className="absolute -bottom-0.5 -right-0.5 size-2.5" />}
    </span>
  );
}
