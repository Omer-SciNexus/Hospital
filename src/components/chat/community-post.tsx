"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { DropdownMenu } from "radix-ui";
import { BadgeCheck, EyeOff, Eye, Flag, Heart, LockKeyhole, MessageCircle, MoreHorizontal, SendHorizontal } from "lucide-react";
import type { CommunityAuthor, CommunityPost } from "@/data/chat";
import { timeAgo } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { ChatAvatar } from "./shared";

function AuthorLine({ author, mine, at }: { author: CommunityAuthor; mine: boolean; at: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <ChatAvatar name={author.name} src={author.avatar} size={36} />
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
          <span className="font-bold">{author.name}</span>
          {mine && <span className="rounded-full bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">You</span>}
          {author.kind === "staff" && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-green-50 px-1.5 py-px text-[11px] font-semibold text-green-700 dark:bg-green-950 dark:text-green-200">
              <BadgeCheck className="size-3.5" aria-hidden /> Verified staff
            </span>
          )}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {author.kind === "staff" && author.title ? `${author.title} · ` : ""}
          <time dateTime={at}>{timeAgo(at)}</time>
        </p>
      </div>
    </div>
  );
}

/** One community post with likes, replies, report and moderation actions. */
export function CommunityPostCard({
  post,
  meId,
  isStaff,
  isModerator,
  canReply,
  onLike,
  onReply,
  onReport,
  onHide,
  onMove,
}: {
  post: CommunityPost;
  meId: string;
  isStaff: boolean;
  isModerator: boolean;
  canReply: boolean;
  onLike: () => void;
  /** Return `false` (or a promise of `false`) when the reply was not posted, to keep the draft. */
  onReply: (body: string) => void | boolean | Promise<boolean>;
  onReport: () => void;
  onHide: (hidden: boolean) => void;
  onMove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [draft, setDraft] = useState("");
  const mine = post.author.id === meId;
  const liked = post.likedBy.includes(meId);
  const reported = post.reports.length > 0;
  const iReported = post.reports.some((r) => r.by === meId);

  if (post.movedTo) {
    return (
      <article id={`post-${post.id}`} className="mt-3 flex items-center gap-3 rounded-2xl border border-dashed border-border bg-surface-2 p-4">
        <Image src="/images/dashboard/moved-to-private.png" alt="" width={64} height={64} className="size-12 shrink-0" />
        <div className="min-w-0 text-sm">
          <p className="font-semibold">A care team member moved this to a private chat.</p>
          <p className="text-xs text-muted-foreground">
            {post.author.name} · {timeAgo(post.createdAt)}
            {isStaff && ` · Moved by ${post.movedTo.by}`}
          </p>
          {mine && (
            <Link href={`/dashboard/messages?thread=${post.movedTo.threadId}`} className="mt-1 inline-block text-xs font-semibold text-primary hover:underline">
              Open your Care chat
            </Link>
          )}
        </div>
      </article>
    );
  }

  if (post.hidden && !isModerator) {
    return (
      <article id={`post-${post.id}`} className="mt-3 flex items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
        <EyeOff className="size-4" aria-hidden /> This post was hidden by a moderator.
      </article>
    );
  }

  const replies = showAll ? post.replies : post.replies.slice(-2);

  return (
    <article
      id={`post-${post.id}`}
      aria-label={`Post by ${post.author.name}`}
      className={cn(
        "mt-3 rounded-2xl border bg-surface p-4 shadow-soft",
        mine ? "border-brand-300 dark:border-brand-800" : "border-border",
        post.hidden && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <AuthorLine author={post.author} mine={mine} at={post.createdAt} />
        <div className="flex shrink-0 items-center gap-1">
          {isModerator && post.hidden && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">Hidden</span>
          )}
          {isModerator && reported && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:bg-red-950 dark:text-red-200"
              title={post.reports.map((r) => r.reason).join(", ")}
            >
              <Flag className="size-3" aria-hidden /> Reported{post.reports.length > 1 ? ` ×${post.reports.length}` : ""}
            </span>
          )}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Post actions">
              <MoreHorizontal className="size-4" aria-hidden />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="end" sideOffset={4} className="z-50 w-60 animate-[menu-in_150ms_ease-out] rounded-2xl border border-border bg-surface p-1.5 shadow-lift">
                {!mine && (
                  <MenuItem onSelect={onReport} disabled={iReported}>
                    <Flag className="size-4" aria-hidden /> {iReported ? "You reported this" : "Report post"}
                  </MenuItem>
                )}
                {isStaff && post.author.kind === "patient" && (
                  <MenuItem onSelect={onMove}>
                    <LockKeyhole className="size-4" aria-hidden /> Move to a private care chat
                  </MenuItem>
                )}
                {isModerator && (
                  <MenuItem onSelect={() => onHide(!post.hidden)}>
                    {post.hidden ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />}
                    {post.hidden ? "Show post again" : "Hide post"}
                  </MenuItem>
                )}
                {mine && !isModerator && post.author.kind === (isStaff ? "staff" : "patient") &&<p className="px-3 py-2 text-xs text-muted-foreground">This is your post.</p>}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      {isModerator && reported && (
        <p className="mt-2 rounded-xl bg-red-50 px-3 py-1.5 text-xs text-red-800 dark:bg-red-950/50 dark:text-red-100">
          Reports: {post.reports.map((r) => r.reason).join(" · ")}
        </p>
      )}

      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed">{post.body}</p>

      <div className="mt-3 flex items-center gap-1">
        <button
          type="button"
          onClick={onLike}
          aria-pressed={liked}
          aria-label={`${liked ? "Unlike" : "Like"}. ${post.likes} likes`}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold tabular-nums transition-colors",
            liked ? "bg-coral-50 text-coral-700 dark:bg-orange-950 dark:text-orange-200" : "text-muted-foreground hover:bg-muted",
          )}
        >
          <Heart className={cn("size-4", liked && "fill-current")} aria-hidden /> {post.likes}
        </button>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground tabular-nums hover:bg-muted"
        >
          <MessageCircle className="size-4" aria-hidden /> {post.replies.length} {post.replies.length === 1 ? "reply" : "replies"}
        </button>
      </div>

      {(open || post.replies.length > 0) && (
        <div className={cn("mt-2 space-y-2 border-l-2 border-border pl-3", !open && post.replies.length === 0 && "hidden")}>
          {post.replies.length > 2 && !showAll && (
            <button type="button" onClick={() => setShowAll(true)} className="text-xs font-semibold text-primary hover:underline">
              Show all {post.replies.length} replies
            </button>
          )}
          {replies.map((r) => (
            <div key={r.id} className="rounded-xl bg-surface-2 px-3 py-2">
              <div className="flex items-center gap-2 text-xs">
                <ChatAvatar name={r.author.name} src={r.author.avatar} size={22} />
                <span className="font-bold">{r.author.name}</span>
                {r.author.kind === "staff" && <BadgeCheck className="size-3.5 text-green-600" aria-label="Verified staff" />}
                <span className="text-muted-foreground">{timeAgo(r.createdAt)}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm">{r.body}</p>
            </div>
          ))}
          {open && canReply && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!draft.trim()) return;
                const done = () => {
                  setDraft("");
                  setShowAll(true);
                };
                const result = onReply(draft.trim());
                if (result instanceof Promise) void result.then((sent) => sent && done());
                else if (result !== false) done();
              }}
              className="flex items-center gap-2"
            >
              <label className="flex-1">
                <span className="sr-only">Write a reply</span>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a kind reply…"
                  className="h-9 w-full rounded-full border border-border bg-background px-4 text-sm focus-visible:border-brand-500 focus-visible:outline-none"
                />
              </label>
              <button type="submit" disabled={!draft.trim()} className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40" aria-label="Send reply">
                <SendHorizontal className="size-4" aria-hidden />
              </button>
            </form>
          )}
        </div>
      )}
    </article>
  );
}

function MenuItem({ children, onSelect, disabled }: { children: React.ReactNode; onSelect: () => void; disabled?: boolean }) {
  return (
    <DropdownMenu.Item
      disabled={disabled}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm outline-none data-[disabled]:cursor-default data-[disabled]:opacity-50 data-[highlighted]:bg-muted"
    >
      {children}
    </DropdownMenu.Item>
  );
}
