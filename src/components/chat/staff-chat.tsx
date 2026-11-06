"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ClipboardList, Hash, Lock, Megaphone, Pin, Search, Siren, SquarePen, X } from "lucide-react";
import type { StaffChannel } from "@/data/chat";
import { staffById } from "@/data/staff";
import { timeAgo } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { readAt, staffUnreadByChannel, useChat, visibleChannels } from "@/store/chat";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Composer } from "./composer";
import { groupInfo, isSmallScreen, lastMineId, plainText, staffReply, useChatIdentity, useSimulatedReply } from "./lib";
import { BackButton, ChatAvatar, ChatFrame, DaySeparator, ListSearch, MessageLog, PaneLayout, TypingIndicator, UnreadBadge } from "./shared";
import { StaffMessageRow } from "./staff-message";
import { HandoverDialog, NewDmDialog, PinnedDialog } from "./staff-dialogs";

const DEFAULT_CHANNEL = "cardiology";

/** Private staff chat: department channels, DMs, mentions, urgent flags and handovers. */
export function StaffChat() {
  const me = useChatIdentity();
  const params = useSearchParams();
  const channels = useChat((s) => s.channels);
  const messages = useChat((s) => s.staffMessages);
  const lastRead = useChat((s) => s.lastRead);
  const sendStaffMessage = useChat((s) => s.sendStaffMessage);
  const markRead = useChat((s) => s.markRead);
  const openDm = useChat((s) => s.openDm);
  const toggleReaction = useChat((s) => s.toggleReaction);
  const togglePin = useChat((s) => s.togglePin);
  const { typing, schedule, later } = useSimulatedReply();

  const visible = useMemo(() => visibleChannels(channels, me.meId), [channels, me.meId]);
  const [selectedId, setSelectedId] = useState(() => params.get("channel") ?? DEFAULT_CHANNEL);
  // Fall back to the default channel, then the user's first own channel (not a hospital-wide one).
  const current =
    visible.find((c) => c.id === selectedId) ??
    visible.find((c) => c.id === DEFAULT_CHANNEL) ??
    visible.find((c) => c.kind === "channel" && !c.open) ??
    visible[0];
  const [mobileOpen, setMobileOpen] = useState(() => !!params.get("channel"));
  const [listQuery, setListQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [activeMsg, setActiveMsg] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"dm" | "pinned" | "handover" | null>(null);
  const [openedAt, setOpenedAt] = useState<{ id: string; at: string } | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const unread = useMemo(() => staffUnreadByChannel({ channels, staffMessages: messages, lastRead }, me.meId), [channels, messages, lastRead, me.meId]);

  const lastByChannel = useMemo(() => {
    const map: Record<string, (typeof messages)[number]> = {};
    for (const m of messages) if (!map[m.channelId] || map[m.channelId].createdAt < m.createdAt) map[m.channelId] = m;
    return map;
  }, [messages]);

  const urgentUnread = useMemo(() => {
    const set = new Set<string>();
    for (const c of visible) {
      const at = readAt(lastRead, me.meId, c.id, c.seedReadAt);
      if (messages.some((m) => m.channelId === c.id && m.urgent && m.authorId !== me.meId && m.createdAt > at)) set.add(c.id);
    }
    return set;
  }, [visible, messages, lastRead, me.meId]);

  const convMessages = useMemo(() => (current ? messages.filter((m) => m.channelId === current.id) : []), [messages, current]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? convMessages.filter((m) => plainText(`${m.body} ${m.handover ? Object.values(m.handover).join(" ") : ""}`).toLowerCase().includes(q)) : convMessages;
  }, [convMessages, query]);
  const pinned = useMemo(() => convMessages.filter((m) => m.pinned), [convMessages]);
  const sentKey = useMemo(() => lastMineId(convMessages, (m) => m.authorId === me.meId), [convMessages, me.meId]);

  // Remember where "new" starts when a conversation opens, then mark it read.
  const currentId = current?.id;
  useEffect(() => {
    if (!current || openedAt?.id === current.id) return;
    setOpenedAt({ id: current.id, at: readAt(lastRead, me.meId, current.id, current.seedReadAt) });
  }, [current, openedAt?.id, lastRead, me.meId]);

  useEffect(() => {
    if (!currentId) return;
    if (isSmallScreen() && !mobileOpen) return;
    markRead(me.meId, currentId);
  }, [currentId, convMessages.length, mobileOpen, me.meId, markRead]);

  function select(id: string) {
    setSelectedId(id);
    setMobileOpen(true);
    setQuery("");
    setSearchOpen(false);
    setUrgent(false);
    setActiveMsg(null);
    if (isSmallScreen()) requestAnimationFrame(() => headingRef.current?.focus());
  }

  function back() {
    setMobileOpen(false);
    requestAnimationFrame(() => document.getElementById(`conv-${currentId}`)?.focus());
  }

  function respond(channel: StaffChannel, text: string, wasUrgent: boolean) {
    if (channel.readOnly) return;
    const others = channel.memberIds.filter((id) => id !== me.meId);
    const awake = others.filter((id) => staffById[id] && staffById[id].presence !== "offline");
    const pool = awake.length ? awake : others;
    const responder = pool[Math.floor(Math.random() * pool.length)];
    if (!responder || !staffById[responder]) return;
    schedule({
      conversationId: channel.id,
      name: staffById[responder].name,
      onReply: () => sendStaffMessage({ channelId: channel.id, authorId: responder, body: staffReply(plainText(text), wasUrgent) }),
    });
  }

  function handleSend(body: string, attachments: Parameters<typeof sendStaffMessage>[0]["attachments"]) {
    if (!current) return;
    sendStaffMessage({ channelId: current.id, authorId: me.meId, body, urgent, attachments });
    if (urgent) toast.warning("Marked urgent, on-call notified", { description: `Paged the on-call team for ${channelTitle(current, me.meId)}.` });
    respond(current, body, urgent);
    setUrgent(false);
  }

  function showMessage(id: string) {
    setDialog(null);
    setQuery("");
    later(() => {
      document.getElementById(`msg-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      setFlashId(id);
    }, 120);
    later(() => setFlashId(null), 1800);
  }

  const q = listQuery.trim().toLowerCase();
  const filterFn = (c: StaffChannel) => !q || channelTitle(c, me.meId).toLowerCase().includes(q) || c.topic.toLowerCase().includes(q);
  const channelList = visible.filter((c) => c.kind === "channel").filter(filterFn);
  const dmList = visible
    .filter((c) => c.kind === "dm")
    .filter(filterFn)
    .sort((a, b) => (lastByChannel[b.id]?.createdAt ?? b.seedReadAt).localeCompare(lastByChannel[a.id]?.createdAt ?? a.seedReadAt));
  const canPost = current && (!current.readOnly || me.role === "admin");
  const other = current?.kind === "dm" ? staffById[current.memberIds.find((id) => id !== me.meId) ?? ""] : undefined;

  const list = (
    <>
      <div className="flex items-center gap-2 border-b border-border p-3">
        <div className="flex-1">
          <ListSearch value={listQuery} onChange={setListQuery} label="Search channels and people" />
        </div>
        <button
          type="button"
          onClick={() => setDialog("dm")}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-800 hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-200"
          aria-label="New direct message"
        >
          <SquarePen className="size-[18px]" aria-hidden />
        </button>
      </div>
      <nav aria-label="Staff conversations" className="min-h-0 flex-1 overflow-y-auto p-2">
        <h2 className="px-2 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Channels</h2>
        <ul className="space-y-0.5">
          {channelList.map((c) => {
            const Icon = c.readOnly ? Megaphone : Hash;
            const active = c.id === current?.id;
            return (
              <li key={c.id}>
                <button
                  id={`conv-${c.id}`}
                  type="button"
                  onClick={() => select(c.id)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors",
                    active ? "bg-brand-50 text-brand-900 dark:bg-brand-950 dark:text-brand-100" : "hover:bg-muted",
                  )}
                >
                  <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className={cn("flex-1 truncate", unread[c.id] ? "font-bold" : "font-medium")}>{c.name}</span>
                  {urgentUnread.has(c.id) && <Siren className="size-3.5 text-red-600" aria-label="Urgent message" />}
                  <UnreadBadge count={unread[c.id] ?? 0} urgent={urgentUnread.has(c.id)} />
                </button>
              </li>
            );
          })}
        </ul>
        <h2 className="px-2 pb-1 pt-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Direct messages</h2>
        <ul className="space-y-0.5">
          {dmList.map((c) => {
            const person = staffById[c.memberIds.find((id) => id !== me.meId) ?? ""];
            if (!person) return null;
            const last = lastByChannel[c.id];
            const active = c.id === current?.id;
            return (
              <li key={c.id}>
                <button
                  id={`conv-${c.id}`}
                  type="button"
                  onClick={() => select(c.id)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors",
                    active ? "bg-brand-50 dark:bg-brand-950" : "hover:bg-muted",
                  )}
                >
                  <ChatAvatar name={person.name} src={person.avatar} size={34} presence={person.presence} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className={cn("flex-1 truncate text-sm", unread[c.id] ? "font-bold" : "font-semibold")}>{person.name}</span>
                      {last && <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(last.createdAt)}</span>}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="flex-1 truncate text-xs text-muted-foreground">
                        {last
                          ? `${last.authorId === me.meId ? "You: " : ""}${plainText(last.body) || (last.handover ? "Sent a handover" : "Sent an attachment")}`
                          : person.title}
                      </span>
                      <UnreadBadge count={unread[c.id] ?? 0} urgent={urgentUnread.has(c.id)} />
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {channelList.length + dmList.length === 0 && (
          <EmptyState compact image="/images/dashboard/empty-staff-chat.png" title="No matches" description={`Nothing matches "${listQuery}".`} />
        )}
      </nav>
    </>
  );

  const conversation = current ? (
    <>
      <header className="flex items-center gap-3 border-b border-border px-3 py-2.5 sm:px-5">
        <BackButton onClick={back} />
        {other ? (
          <ChatAvatar name={other.name} src={other.avatar} size={38} presence={other.presence} />
        ) : (
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200">
            {current.readOnly ? <Megaphone className="size-4" aria-hidden /> : <Hash className="size-4" aria-hidden />}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 ref={headingRef} tabIndex={-1} className="truncate text-base font-bold focus:outline-none">
            {channelTitle(current, me.meId)}
          </h2>
          <p className="truncate text-xs text-muted-foreground">
            {other ? `${other.title} · ${other.presence}` : `${current.open ? "All staff" : `${current.memberIds.length} members`} · ${current.topic}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialog("pinned")}
          className="relative grid size-9 place-items-center rounded-full hover:bg-muted"
          aria-label={`Pinned messages, ${pinned.length}`}
        >
          <Pin className="size-[18px]" aria-hidden />
          {pinned.length > 0 && (
            <span className="absolute right-0.5 top-0.5 grid min-w-4 place-items-center rounded-full bg-amber-700 px-1 text-[10px] font-bold text-white" aria-hidden>
              {pinned.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            setSearchOpen((o) => !o);
            setQuery("");
          }}
          aria-pressed={searchOpen}
          className={cn("grid size-9 place-items-center rounded-full hover:bg-muted", searchOpen && "bg-muted")}
          aria-label="Search in this conversation"
        >
          <Search className="size-[18px]" aria-hidden />
        </button>
      </header>

      {searchOpen && (
        <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-3 py-2 sm:px-5">
          <label className="flex-1">
            <span className="sr-only">Search messages</span>
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
              placeholder={`Search in ${channelTitle(current, me.meId)}`}
              className="h-9 w-full rounded-full border border-border bg-background px-4 text-sm focus-visible:border-brand-500 focus-visible:outline-none"
            />
          </label>
          {query && (
            <span className="shrink-0 text-xs text-muted-foreground" role="status">
              {shown.length} found
            </span>
          )}
          <button type="button" onClick={() => setSearchOpen(false)} className="grid size-8 place-items-center rounded-full hover:bg-muted" aria-label="Close search">
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}

      <MessageLog key={current.id} label={`Messages in ${channelTitle(current, me.meId)}`} changeKey={`${shown.length}-${typing?.conversationId === current.id}`} sentKey={sentKey}>
        {convMessages.length === 0 ? (
          <EmptyState
            image="/images/dashboard/empty-channel.png"
            title={other ? `Say hello to ${other.name.split(" ")[0]}` : "No messages yet"}
            description="Messages here are private to hospital staff."
          />
        ) : shown.length === 0 ? (
          <EmptyState compact image="/images/dashboard/empty-search.png" title="No messages found" description={`Nothing matches "${query}".`} />
        ) : (
          shown.map((m, i) => {
            const g = groupInfo(shown, i);
            const firstNew =
              !query && openedAt?.id === current.id && m.authorId !== me.meId && m.createdAt > openedAt.at && !(shown[i - 1] && shown[i - 1].createdAt > openedAt.at);
            return (
              <div key={m.id}>
                {g.newDay && <DaySeparator iso={m.createdAt} />}
                {firstNew && (
                  <div className="my-3 flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-coral-700 dark:text-orange-300">
                    <span className="h-px flex-1 bg-coral-500/50" /> New <span className="h-px flex-1 bg-coral-500/50" />
                  </div>
                )}
                <StaffMessageRow
                  msg={m}
                  meId={me.meId}
                  mine={m.authorId === me.meId}
                  groupStart={g.groupStart || g.newDay || firstNew}
                  query={query.trim() || undefined}
                  active={activeMsg === m.id}
                  flash={flashId === m.id}
                  onToggleActive={() => setActiveMsg((a) => (a === m.id ? null : m.id))}
                  onReact={(e) => toggleReaction(m.id, e, me.meId)}
                  onPin={() => {
                    togglePin(m.id);
                    toast.success(m.pinned ? "Message unpinned" : "Message pinned");
                  }}
                />
              </div>
            );
          })
        )}
        {typing?.conversationId === current.id && <TypingIndicator name={typing.name} />}
      </MessageLog>

      {canPost ? (
        <Composer
          inputRef={inputRef}
          label={`Message ${channelTitle(current, me.meId)}`}
          placeholder={`Message ${channelTitle(current, me.meId)}`}
          mentionPatients
          tone={urgent ? "urgent" : "default"}
          onSend={handleSend}
          tools={
            <>
              <button
                type="button"
                onClick={() => setDialog("handover")}
                className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Send an SBAR handover"
                title="Handover (SBAR)"
              >
                <ClipboardList className="size-[18px]" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setUrgent((u) => !u)}
                aria-pressed={urgent}
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-full transition-colors",
                  urgent ? "bg-red-600 text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                aria-label="Mark as urgent"
                title="Mark as urgent"
              >
                <Siren className="size-[18px]" aria-hidden />
              </button>
            </>
          }
        />
      ) : (
        <p className="flex items-center justify-center gap-2 border-t border-border bg-surface-2 px-4 py-4 text-sm text-muted-foreground">
          <Lock className="size-4" aria-hidden /> Only admins can post in #{current.name}.
        </p>
      )}
    </>
  ) : (
    <EmptyState image="/images/dashboard/empty-staff-chat.png" title="Pick a conversation" />
  );

  return (
    <>
      <ChatFrame
        eyebrow="Staff only"
        title="Staff chat"
        description="Private to hospital staff. Type @ to mention a patient, use the siren for urgent messages."
        hideHeaderOnMobile={mobileOpen}
      >
        <PaneLayout list={list} conversation={conversation} showConversation={mobileOpen} />
      </ChatFrame>

      <NewDmDialog open={dialog === "dm"} onOpenChange={(o) => setDialog(o ? "dm" : null)} meId={me.meId} onPick={(id) => select(openDm(me.meId, id))} />
      <PinnedDialog
        open={dialog === "pinned"}
        onOpenChange={(o) => setDialog(o ? "pinned" : null)}
        pinned={pinned}
        onShow={showMessage}
        onUnpin={(id) => {
          togglePin(id);
          toast.success("Message unpinned");
        }}
      />
      <HandoverDialog
        open={dialog === "handover"}
        onOpenChange={(o) => setDialog(o ? "handover" : null)}
        onSubmit={(h) => {
          if (!current) return;
          sendStaffMessage({ channelId: current.id, authorId: me.meId, body: "", handover: h, urgent });
          toast.success("Handover sent");
          respond(current, "handover", false);
          setUrgent(false);
        }}
      />
    </>
  );
}

function channelTitle(c: StaffChannel, meId: string) {
  if (c.kind === "channel") return `#${c.name}`;
  return staffById[c.memberIds.find((id) => id !== meId) ?? ""]?.name ?? "Direct message";
}
