"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { DropdownMenu } from "radix-ui";
import { toast } from "sonner";
import { Archive, ArchiveRestore, BookOpen, Flag, Lock, LockOpen, Pin, PinOff, Plus, Settings2, ShieldAlert } from "lucide-react";
import type { Role } from "@/config/navigation";
import type { CommunityAuthor, CommunityTopic } from "@/data/chat";
import { cn } from "@/lib/utils";
import { useChat, visibleCareThreads } from "@/store/chat";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Composer } from "./composer";
import { CommunityPostCard } from "./community-post";
import {
  CreateTopicDialog,
  FirstPostDialog,
  GuidelinesDialog,
  MoveToPrivateDialog,
  ReportDialog,
  readAck,
  readProfile,
  type CommunityProfile,
} from "./community-dialogs";
import { groupInfo, isSmallScreen, lastMineId, useChatIdentity } from "./lib";
import { BackButton, ChatFrame, DaySeparator, ListSearch, MessageLog, PaneLayout } from "./shared";

const MODERATORS: Role[] = ["admin", "doctor", "nurse"];

/** Public community: topic channels, nickname posting for patients, moderation for staff. */
export function Community() {
  const me = useChatIdentity();
  const router = useRouter();
  const params = useSearchParams();
  const isModerator = MODERATORS.includes(me.role);
  const topics = useChat((s) => s.topics);
  const posts = useChat((s) => s.posts);
  const { addPost, addReply, toggleLike, reportPost, setPostHidden, movePostToPrivate, createTopic, updateTopic } = useChat.getState();

  const [profile, setProfile] = useState<CommunityProfile | null>(() => readProfile());
  const [acked, setAcked] = useState(() => readAck());
  const [selectedId, setSelectedId] = useState(() => params.get("topic") ?? "general");
  const [mobileOpen, setMobileOpen] = useState(() => !!params.get("topic"));
  const [q, setQ] = useState("");
  const [reportedOnly, setReportedOnly] = useState(false);
  const [dialog, setDialog] = useState<null | "guidelines" | "first" | "topic" | "report" | "move">(null);
  const [targetPost, setTargetPost] = useState<string | null>(null);
  /** Post or reply waiting for the first-post dialog; `resolve` tells the composer if it was sent. */
  const pending = useRef<{ action: (author: CommunityAuthor) => void; resolve: (sent: boolean) => void } | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const visibleTopics = useMemo(() => topics.filter((t) => isModerator || !t.archived), [topics, isModerator]);
  const current = visibleTopics.find((t) => t.id === selectedId) ?? visibleTopics[0];

  const stats = useMemo(() => {
    const map: Record<string, { posts: number; reported: number; today: number }> = {};
    const dayAgo = new Date(Date.now() - 24 * 3600_000).toISOString();
    for (const p of posts) {
      const s = (map[p.topicId] ??= { posts: 0, reported: 0, today: 0 });
      if (!p.hidden && !p.movedTo) s.posts++;
      if (p.reports.length && !p.hidden && !p.movedTo) s.reported++;
      if (p.createdAt > dayAgo && !p.hidden && !p.movedTo) s.today++;
    }
    return map;
  }, [posts]);

  const feed = useMemo(() => {
    const list = current ? posts.filter((p) => p.topicId === current.id) : [];
    const sorted = [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return reportedOnly ? sorted.filter((p) => p.reports.length > 0) : sorted;
  }, [posts, current, reportedOnly]);
  const sentKey = useMemo(() => lastMineId(feed, (p) => p.author.id === me.meId), [feed, me.meId]);

  const term = q.trim().toLowerCase();
  const listed = visibleTopics
    .filter((t) => !term || `${t.name} ${t.description}`.toLowerCase().includes(term))
    .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || Number(!!a.archived) - Number(!!b.archived) || Number(!!a.custom) - Number(!!b.custom));
  const active = listed.filter((t) => !t.archived);
  const archived = listed.filter((t) => t.archived);

  function myAuthor(p: CommunityProfile | null = profile): CommunityAuthor | null {
    if (me.isStaff) return { kind: "staff", id: me.meId, name: me.name, title: me.title, avatar: me.avatar };
    if (!p) return null;
    return { kind: "patient", id: me.meId, name: p.nickname, avatar: p.avatar };
  }

  /**
   * Runs `action` once the user has seen the privacy note and (patients) picked a nickname.
   * Returns true when it ran now, or a promise that is false if the dialog was closed.
   */
  function withAuthor(action: (author: CommunityAuthor) => void): true | Promise<boolean> {
    const author = myAuthor();
    if (author && acked) {
      action(author);
      return true;
    }
    pending.current?.resolve(false);
    return new Promise<boolean>((resolve) => {
      pending.current = { action, resolve };
      setDialog("first");
    });
  }

  function select(id: string) {
    setSelectedId(id);
    setMobileOpen(true);
    setReportedOnly(false);
    if (isSmallScreen()) requestAnimationFrame(() => headingRef.current?.focus());
  }

  function back() {
    setMobileOpen(false);
    requestAnimationFrame(() => document.getElementById(`conv-${current?.id}`)?.focus());
  }

  function moderate(topic: CommunityTopic, patch: Partial<Pick<CommunityTopic, "pinned" | "locked" | "archived">>, message: string) {
    updateTopic(topic.id, patch);
    toast.success(message);
  }

  const target = posts.find((p) => p.id === targetPost);
  const closed = current?.locked || current?.archived;

  const list = (
    <>
      <div className="flex items-center gap-2 border-b border-border p-3">
        <div className="flex-1">
          <ListSearch value={q} onChange={setQ} label="Search topics" />
        </div>
        <button
          type="button"
          onClick={() => setDialog("topic")}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground hover:bg-brand-800 dark:hover:bg-brand-300"
          aria-label="Create a new topic"
        >
          <Plus className="size-5" aria-hidden />
        </button>
      </div>
      <nav aria-label="Community topics" className="min-h-0 flex-1 overflow-y-auto p-2">
        <TopicList topics={active} currentId={current?.id} stats={stats} isModerator={isModerator} onSelect={select} />
        {archived.length > 0 && (
          <>
            <h2 className="px-2 pb-1 pt-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Archived</h2>
            <TopicList topics={archived} currentId={current?.id} stats={stats} isModerator={isModerator} onSelect={select} />
          </>
        )}
        {listed.length === 0 && (
          <EmptyState
            compact
            image="/images/dashboard/empty-community.png"
            title="No topics found"
            description="Start a new topic. It goes live right away."
            action={
              <Button size="sm" onClick={() => setDialog("topic")}>
                New topic
              </Button>
            }
          />
        )}
      </nav>
    </>
  );

  const conversation = current ? (
    <>
      <header className="flex items-center gap-3 border-b border-border px-3 py-2.5 sm:px-5">
        <BackButton onClick={back} />
        <Image src={current.icon} alt="" width={80} height={80} className="size-10 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <h2 ref={headingRef} tabIndex={-1} className="flex items-center gap-1.5 truncate text-base font-bold focus:outline-none">
            <span className="truncate">{current.name}</span>
            {current.pinned && <Pin className="size-3.5 shrink-0 text-amber-600" aria-label="Pinned topic" />}
            {current.locked && <Lock className="size-3.5 shrink-0 text-muted-foreground" aria-label="Locked" />}
            {current.archived && <Archive className="size-3.5 shrink-0 text-muted-foreground" aria-label="Archived" />}
          </h2>
          <p className="truncate text-xs text-muted-foreground">
            {current.members.toLocaleString("en-US")} members · {current.description}
          </p>
        </div>
        <button type="button" onClick={() => setDialog("guidelines")} className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-muted" aria-label="Community guidelines">
          <BookOpen className="size-[18px]" aria-hidden />
        </button>
        {isModerator && (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-muted" aria-label="Moderate topic">
              <Settings2 className="size-[18px]" aria-hidden />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="end" sideOffset={6} className="z-50 w-60 animate-[menu-in_150ms_ease-out] rounded-2xl border border-border bg-surface p-1.5 shadow-lift">
                <DropdownMenu.Label className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Moderation</DropdownMenu.Label>
                <ModItem onSelect={() => moderate(current, { pinned: !current.pinned }, current.pinned ? "Topic unpinned" : "Topic pinned to the top")}>
                  {current.pinned ? <PinOff className="size-4" aria-hidden /> : <Pin className="size-4" aria-hidden />}
                  {current.pinned ? "Unpin topic" : "Pin topic"}
                </ModItem>
                <ModItem onSelect={() => moderate(current, { locked: !current.locked }, current.locked ? "Topic unlocked" : "Topic locked. No new posts.")}>
                  {current.locked ? <LockOpen className="size-4" aria-hidden /> : <Lock className="size-4" aria-hidden />}
                  {current.locked ? "Unlock topic" : "Lock topic"}
                </ModItem>
                <ModItem onSelect={() => moderate(current, { archived: !current.archived }, current.archived ? "Topic restored" : "Topic archived")}>
                  {current.archived ? <ArchiveRestore className="size-4" aria-hidden /> : <Archive className="size-4" aria-hidden />}
                  {current.archived ? "Restore topic" : "Archive topic"}
                </ModItem>
                <DropdownMenu.Separator className="my-1 h-px bg-border" />
                <DropdownMenu.CheckboxItem
                  checked={reportedOnly}
                  onCheckedChange={(c) => setReportedOnly(c === true)}
                  className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm outline-none data-[highlighted]:bg-muted"
                >
                  <Flag className="size-4" aria-hidden /> Show reported only
                  <DropdownMenu.ItemIndicator className="ml-auto text-xs font-bold text-primary">On</DropdownMenu.ItemIndicator>
                </DropdownMenu.CheckboxItem>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}
      </header>

      <div role="note" className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100 sm:px-5">
        <ShieldAlert className="size-4 shrink-0" aria-hidden />
        <p>
          <strong>Don&apos;t share personal medical details here.</strong> Posts are not medical advice.{" "}
          <button type="button" onClick={() => setDialog("guidelines")} className="font-semibold underline">
            Guidelines
          </button>
        </p>
      </div>

      {reportedOnly && (
        <div className="flex items-center justify-between border-b border-border bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 dark:bg-red-950/50 dark:text-red-100 sm:px-5">
          Showing reported posts only
          <button type="button" onClick={() => setReportedOnly(false)} className="underline">
            Show all
          </button>
        </div>
      )}

      <MessageLog key={`${current.id}-${reportedOnly}`} label={`Posts in ${current.name}`} changeKey={feed.length} sentKey={sentKey} className="bg-background/60">
        {feed.length === 0 ? (
          <EmptyState
            image="/images/dashboard/empty-channel.png"
            title={reportedOnly ? "No reported posts" : "No posts yet"}
            description={reportedOnly ? "Nothing to review here." : closed ? "This topic is closed." : "Be the first to start the conversation."}
          />
        ) : (
          feed.map((p, i) => {
            const g = groupInfo(
              feed.map((x) => ({ authorId: x.author.id, createdAt: x.createdAt })),
              i,
            );
            return (
              <div key={p.id}>
                {g.newDay && <DaySeparator iso={p.createdAt} />}
                <CommunityPostCard
                  post={p}
                  meId={me.meId}
                  isStaff={me.isStaff}
                  isModerator={isModerator}
                  canReply={!closed}
                  onLike={() => toggleLike(p.id, me.meId)}
                  onReply={(body) =>
                    withAuthor((author) => {
                      addReply(p.id, author, body);
                      toast.success("Reply posted");
                    })
                  }
                  onReport={() => {
                    setTargetPost(p.id);
                    setDialog("report");
                  }}
                  onHide={(hidden) => {
                    setPostHidden(p.id, hidden);
                    toast.success(hidden ? "Post hidden from members" : "Post visible again");
                  }}
                  onMove={() => {
                    setTargetPost(p.id);
                    setDialog("move");
                  }}
                />
              </div>
            );
          })
        )}
        <div className="h-2" />
      </MessageLog>

      {current.archived ? (
        <p className="flex items-center justify-center gap-2 border-t border-border bg-surface-2 px-4 py-4 text-sm text-muted-foreground">
          <Archive className="size-4" aria-hidden /> This topic is archived. You can read it, but not post.
        </p>
      ) : current.locked ? (
        <p className="flex items-center justify-center gap-2 border-t border-border bg-surface-2 px-4 py-4 text-sm text-muted-foreground">
          <Lock className="size-4" aria-hidden /> This topic is locked by a moderator. No new posts.
        </p>
      ) : (
        <Composer
          noAttach
          label={`Post in ${current.name}`}
          placeholder={me.isStaff ? `Post in ${current.name} as ${me.name}` : profile ? `Post as ${profile.nickname}…` : `Share something with ${current.name}…`}
          onSend={(body) =>
            withAuthor((author) => {
              addPost({ topicId: current.id, author, body });
              toast.success("Posted", { description: `Your post is live in ${current.name}.` });
            })
          }
        />
      )}
    </>
  ) : (
    <div className="grid flex-1 place-items-center">
      <EmptyState image="/images/dashboard/empty-community.png" title="No topics yet" description="Create the first topic." />
    </div>
  );

  return (
    <>
      <ChatFrame
        eyebrow={me.role === "admin" ? "Moderation" : "Community"}
        title={me.role === "admin" ? "Community moderation" : "Community"}
        description={
          me.isStaff
            ? "Patients post with nicknames. You post with your name and a Verified staff badge."
            : profile
              ? `Share, ask and support each other. You post as ${profile.nickname}.`
              : "Share, ask and support each other. You post with a nickname."
        }
        hideHeaderOnMobile={mobileOpen}
        actions={
          <>
            <Button size="sm" variant="soft" onClick={() => setDialog("guidelines")}>
              <BookOpen aria-hidden /> Guidelines
            </Button>
            <Button size="sm" onClick={() => setDialog("topic")}>
              <Plus aria-hidden /> New topic
            </Button>
          </>
        }
      >
        <PaneLayout list={list} conversation={conversation} showConversation={mobileOpen && !!current} />
      </ChatFrame>

      <GuidelinesDialog open={dialog === "guidelines"} onOpenChange={(o) => setDialog(o ? "guidelines" : null)} />
      <FirstPostDialog
        key={`${!me.isStaff && !profile}-${!acked}`}
        open={dialog === "first"}
        onOpenChange={(o) => {
          setDialog(o ? "first" : null);
          if (!o) {
            pending.current?.resolve(false);
            pending.current = null;
          }
        }}
        needNickname={!me.isStaff && !profile}
        needAck={!acked}
        onDone={(p) => {
          setAcked(true);
          const next = p ?? profile;
          if (p) setProfile(p);
          const author = myAuthor(next);
          const job = pending.current;
          pending.current = null;
          if (author && job) job.action(author);
          job?.resolve(!!author);
        }}
      />
      <CreateTopicDialog
        open={dialog === "topic"}
        onOpenChange={(o) => setDialog(o ? "topic" : null)}
        onCreate={(v) => {
          const id = createTopic({ name: v.name, description: v.description, createdBy: me.isStaff ? me.name : profile?.nickname ?? "Member" });
          select(id);
          toast.success("Topic created", { description: `"${v.name}" is live for everyone.` });
        }}
      />
      <ReportDialog
        open={dialog === "report"}
        onOpenChange={(o) => setDialog(o ? "report" : null)}
        onReport={(reason) => {
          if (targetPost) reportPost(targetPost, reason, me.meId);
          toast.success("Thanks for reporting", { description: "Our moderators will review it soon." });
        }}
      />
      <MoveToPrivateDialog
        open={dialog === "move"}
        onOpenChange={(o) => setDialog(o ? "move" : null)}
        authorName={target?.author.name ?? "the patient"}
        onConfirm={() => {
          if (!targetPost) return;
          const threadId = movePostToPrivate(targetPost, { id: me.meId, name: me.name, role: me.role });
          if (!threadId) return;
          const canOpen = visibleCareThreads(useChat.getState().careThreads, me.role, me.meId).some((t) => t.id === threadId);
          toast.success("Moved to a private care chat", {
            description: "The patient will see it in their Care chat.",
            action: canOpen ? { label: "Open", onClick: () => router.push(`/dashboard/messages?thread=${threadId}`) } : undefined,
          });
        }}
      />
    </>
  );
}

function TopicList({
  topics,
  currentId,
  stats,
  isModerator,
  onSelect,
}: {
  topics: CommunityTopic[];
  currentId?: string;
  stats: Record<string, { posts: number; reported: number; today: number }>;
  isModerator: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="space-y-0.5">
      {topics.map((t) => {
        const s = stats[t.id] ?? { posts: 0, reported: 0, today: 0 };
        const active = t.id === currentId;
        return (
          <li key={t.id}>
            <button
              id={`conv-${t.id}`}
              type="button"
              onClick={() => onSelect(t.id)}
              aria-current={active ? "true" : undefined}
              className={cn("flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors", active ? "bg-brand-50 dark:bg-brand-950" : "hover:bg-muted", t.archived && "opacity-70")}
            >
              <Image src={t.icon} alt="" width={80} height={80} className="size-10 shrink-0 rounded-xl" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold">{t.name}</span>
                  {t.pinned && <Pin className="size-3 shrink-0 text-amber-600" aria-label="Pinned" />}
                  {t.locked && <Lock className="size-3 shrink-0 text-muted-foreground" aria-label="Locked" />}
                  {t.custom && <span className="shrink-0 rounded-full bg-blue-50 px-1.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-200">Member topic</span>}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {s.posts} posts{s.today ? ` · ${s.today} new today` : ""}
                </span>
              </span>
              {isModerator && s.reported > 0 && (
                <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-red-50 px-1.5 py-0.5 text-[11px] font-bold text-red-700 dark:bg-red-950 dark:text-red-200" title={`${s.reported} reported`}>
                  <Flag className="size-3" aria-hidden /> {s.reported}
                  <span className="sr-only">reported posts</span>
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function ModItem({ children, onSelect }: { children: React.ReactNode; onSelect: () => void }) {
  return (
    <DropdownMenu.Item onSelect={onSelect} className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm outline-none data-[highlighted]:bg-muted">
      {children}
    </DropdownMenu.Item>
  );
}
