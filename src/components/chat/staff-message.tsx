"use client";

import { ClipboardList, Pin, PinOff, Siren, SmilePlus } from "lucide-react";
import type { Handover, StaffMessage } from "@/data/chat";
import { patientsById } from "@/data/patients";
import { staffById } from "@/data/staff";
import { formatTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { EmojiPicker } from "./composer";
import { AttachmentList, ChatAvatar, PatientChip, RichText } from "./shared";

const REACTIONS = ["👍", "❤️", "🙏", "✅", "👀", "🎉", "😂", "😮"];

/** Mini SBAR card for handover messages. */
export function HandoverCard({ handover, note }: { handover: Handover; note?: string }) {
  const p = patientsById[handover.patientId];
  const rows: [string, string, string][] = [
    ["S", "Situation", handover.situation],
    ["B", "Background", handover.background],
    ["A", "Assessment", handover.assessment],
    ["R", "Recommendation", handover.recommendation],
  ];
  return (
    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-blue-200 bg-surface text-left text-foreground shadow-soft dark:border-blue-900">
      <div className="flex flex-wrap items-center gap-2 bg-blue-50 px-4 py-2.5 dark:bg-blue-950">
        <ClipboardList className="size-4 text-blue-700 dark:text-blue-200" aria-hidden />
        <span className="text-sm font-bold text-blue-800 dark:text-blue-100">Handover · SBAR</span>
        {p && <PatientChip patientId={p.id} />}
      </div>
      {note && <p className="border-b border-border px-4 py-2 text-sm">{note}</p>}
      {p?.ward && (
        <p className="border-b border-border px-4 py-1.5 text-xs text-muted-foreground">
          {p.ward}, bed {p.bed} · NEWS {p.news} · Allergies: {p.allergies.length ? p.allergies.join(", ") : "none"}
        </p>
      )}
      <dl className="divide-y divide-border">
        {rows.map(([letter, label, text]) => (
          <div key={letter} className="flex gap-3 px-4 py-2">
            <dt className="flex w-28 shrink-0 items-start gap-2 text-xs font-bold text-muted-foreground">
              <span className="grid size-5 shrink-0 place-items-center rounded-md bg-blue-600 text-[11px] text-white" aria-hidden>
                {letter}
              </span>
              {label}
            </dt>
            <dd className="text-sm">{text}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** One staff chat message: bubble, urgent flag, handover card, reactions and actions. */
export function StaffMessageRow({
  msg,
  meId,
  mine,
  groupStart,
  query,
  active,
  flash,
  onToggleActive,
  onReact,
  onPin,
}: {
  msg: StaffMessage;
  meId: string;
  mine: boolean;
  groupStart: boolean;
  query?: string;
  active: boolean;
  flash: boolean;
  onToggleActive: () => void;
  onReact: (emoji: string) => void;
  onPin: () => void;
}) {
  const author = staffById[msg.authorId];
  const name = author?.name ?? "Staff member";
  const reactions = Object.entries(msg.reactions);

  return (
    <div id={`msg-${msg.id}`} className={cn("group flex gap-2.5 scroll-mt-16", mine && "flex-row-reverse", groupStart ? "mt-4" : "mt-1")}>
      <div className="w-8 shrink-0">{groupStart && !mine && <ChatAvatar name={name} src={author?.avatar} size={32} />}</div>
      <div className={cn("flex min-w-0 max-w-[88%] flex-col sm:max-w-[75%]", mine ? "items-end" : "items-start")}>
        {groupStart && (
          <p className={cn("mb-1 flex flex-wrap items-baseline gap-x-2 text-xs", mine && "flex-row-reverse")}>
            <span className="font-bold text-foreground">{mine ? "You" : name}</span>
            {!mine && author?.title && <span className="text-muted-foreground">{author.title}</span>}
            <time dateTime={msg.createdAt} className="text-muted-foreground">
              {formatTime(msg.createdAt)}
            </time>
          </p>
        )}

        <div className={cn("flex max-w-full items-center gap-1", mine && "flex-row-reverse")}>
          {msg.type === "handover" && msg.handover ? (
            <div className={cn("rounded-2xl transition-shadow", flash && "ring-4 ring-amber-300")}>
              {msg.urgent && <UrgentTag />}
              <HandoverCard handover={msg.handover} note={msg.body} />
            </div>
          ) : (
            <div
              onClick={onToggleActive}
              title={new Date(msg.createdAt).toLocaleString()}
              className={cn(
                "min-w-0 rounded-2xl px-3.5 py-2 text-sm transition-shadow",
                msg.urgent
                  ? "bg-red-50 text-red-950 ring-1 ring-red-300 dark:bg-red-950/60 dark:text-red-50 dark:ring-red-800"
                  : mine
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-2 text-foreground",
                groupStart && (mine ? "rounded-tr-md" : "rounded-tl-md"),
                flash && "ring-4 ring-amber-300",
              )}
            >
              {msg.urgent && <UrgentTag />}
              {msg.body && <RichText body={msg.body} query={query} onDark={mine && !msg.urgent} />}
              {msg.attachments && <AttachmentList items={msg.attachments} onDark={mine && !msg.urgent} />}
            </div>
          )}

          <div
            className={cn(
              "flex shrink-0 items-center gap-0.5 transition-opacity",
              active ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
            )}
          >
            <EmojiPicker
              onPick={onReact}
              emojis={REACTIONS}
              trigger={
                <button type="button" className="grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Add reaction">
                  <SmilePlus className="size-4" aria-hidden />
                </button>
              }
            />
            <button
              type="button"
              onClick={onPin}
              className="grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={msg.pinned ? "Unpin message" : "Pin message"}
            >
              {msg.pinned ? <PinOff className="size-4" aria-hidden /> : <Pin className="size-4" aria-hidden />}
            </button>
          </div>
        </div>

        {(reactions.length > 0 || msg.pinned) && (
          <div className={cn("mt-1 flex flex-wrap items-center gap-1", mine && "justify-end")}>
            {msg.pinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                <Pin className="size-3" aria-hidden /> Pinned
              </span>
            )}
            {reactions.map(([emoji, who]) => {
              const reacted = who.includes(meId);
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onReact(emoji)}
                  aria-pressed={reacted}
                  aria-label={`${emoji} ${who.length}. ${reacted ? "Remove your reaction" : "Add your reaction"}`}
                  title={who.map((id) => (id === meId ? "You" : staffById[id]?.name ?? id)).join(", ")}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs tabular-nums transition-colors",
                    reacted
                      ? "border-brand-400 bg-brand-50 font-semibold text-brand-800 dark:bg-brand-950 dark:text-brand-200"
                      : "border-border bg-surface hover:border-brand-300",
                  )}
                >
                  <span aria-hidden>{emoji}</span>
                  {who.length}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function UrgentTag() {
  return (
    <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white">
      <Siren className="size-3" aria-hidden /> URGENT
    </span>
  );
}
