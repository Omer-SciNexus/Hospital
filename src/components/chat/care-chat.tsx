"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Check, CheckCheck, Plus } from "lucide-react";
import type { Role } from "@/config/navigation";
import { site } from "@/config/site";
import type { CareMessage, CareThread, ChatAttachment } from "@/data/chat";
import { patientsById } from "@/data/patients";
import { staffById } from "@/data/staff";
import { formatTime, timeAgo } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { careUnreadByThread, useChat, visibleCareThreads } from "@/store/chat";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Composer } from "./composer";
import { NewConversationDialog, topicMeta } from "./care-dialogs";
import { careTeamReply, groupInfo, isSmallScreen, lastMineId, patientReply, personInfo, useChatIdentity, useSimulatedReply } from "./lib";
import { AttachmentList, BackButton, ChatAvatar, ChatFrame, DaySeparator, ListSearch, MessageLog, PaneLayout, TypingIndicator, UnreadBadge } from "./shared";

const quickReplies: Partial<Record<Role, string[]>> = {
  doctor: [
    "Thanks, I'll review this today.",
    "Please book a follow-up visit.",
    "Keep measuring your blood pressure twice a day.",
    `If it gets worse, call ${site.emergencyPhone}.`,
  ],
  nurse: [
    "Thanks, I'll come and see you shortly.",
    "Please press the call bell if you need help.",
    "I'll ask your doctor and let you know.",
    "Visiting hours are 10:00 to 20:00.",
  ],
  pharmacist: [
    "Your prescription is approved.",
    "Please upload a clearer photo of your prescription.",
    "Your order has shipped.",
    "Take it with food, once a day.",
  ],
  billing: [
    "Your insurance card is verified.",
    "I've sent the claim to your insurer.",
    "Your pre-approval was approved.",
    "No payment is due right now.",
  ],
};

function refHref(refId: string | undefined, role: Role) {
  if (!refId) return undefined;
  if (refId.startsWith("APT")) return role === "patient" ? "/dashboard/appointments" : role === "doctor" ? "/dashboard/schedule" : undefined;
  if (refId.startsWith("ORD")) return role === "patient" ? "/dashboard/orders" : role === "pharmacist" ? "/dashboard/rx-queue" : role === "billing" ? "/dashboard/claims" : undefined;
  return undefined;
}

/** Private patient ↔ care team messages. Patients see their threads; staff see an inbox. */
export function CareChat() {
  const me = useChatIdentity();
  const isPatient = me.role === "patient";
  const params = useSearchParams();
  const threads = useChat((s) => s.careThreads);
  const messages = useChat((s) => s.careMessages);
  const lastRead = useChat((s) => s.lastRead);
  const sendCareMessage = useChat((s) => s.sendCareMessage);
  const setCareStatus = useChat((s) => s.setCareStatus);
  const markCareSeen = useChat((s) => s.markCareSeen);
  const markRead = useChat((s) => s.markRead);
  const createCareThread = useChat((s) => s.createCareThread);
  const { typing, schedule, later } = useSimulatedReply();

  const mine = useMemo(() => visibleCareThreads(threads, me.role, me.meId), [threads, me.role, me.meId]);
  const unread = useMemo(() => careUnreadByThread({ careThreads: threads, careMessages: messages, lastRead }, me.role, me.meId), [threads, messages, lastRead, me.role, me.meId]);
  const lastByThread = useMemo(() => {
    const map: Record<string, CareMessage> = {};
    for (const m of messages) if (!map[m.threadId] || map[m.threadId].createdAt < m.createdAt) map[m.threadId] = m;
    return map;
  }, [messages]);

  const sorted = useMemo(
    () => [...mine].sort((a, b) => (lastByThread[b.id]?.createdAt ?? b.createdAt).localeCompare(lastByThread[a.id]?.createdAt ?? a.createdAt)),
    [mine, lastByThread],
  );

  const [selectedId, setSelectedId] = useState<string | null>(() => params.get("thread"));
  const [mobileOpen, setMobileOpen] = useState(() => !!params.get("thread"));
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "reply">("all");
  const [newOpen, setNewOpen] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const current = sorted.find((t) => t.id === selectedId) ?? sorted[0];
  const currentId = current?.id;
  const convMessages = useMemo(() => (currentId ? messages.filter((m) => m.threadId === currentId) : []), [messages, currentId]);
  const sentKey = useMemo(() => lastMineId(convMessages, (m) => m.authorId === me.meId), [convMessages, me.meId]);

  // Only mark read once the user picked this thread (click or ?thread=), not the default preview.
  const picked = !!currentId && currentId === selectedId;
  useEffect(() => {
    if (!currentId || !picked) return;
    if (isSmallScreen() && !mobileOpen) return;
    markRead(me.meId, currentId);
    markCareSeen(currentId, isPatient);
  }, [currentId, picked, convMessages.length, mobileOpen, me.meId, isPatient, markRead, markCareSeen]);

  const nameOf = (t: CareThread) => (isPatient ? personInfo(t.staffId).name : patientsById[t.patientId]?.name ?? t.patientName ?? "Patient");
  const term = q.trim().toLowerCase();
  const listed = sorted.filter((t) => {
    if (term && !`${t.title} ${nameOf(t)} ${t.refId ?? ""}`.toLowerCase().includes(term)) return false;
    if (filter === "unread") return !!unread[t.id];
    if (filter === "reply") return lastByThread[t.id]?.authorId === t.patientId;
    return true;
  });

  function select(id: string) {
    setSelectedId(id);
    setMobileOpen(true);
    if (isSmallScreen()) requestAnimationFrame(() => headingRef.current?.focus());
  }

  function back() {
    setMobileOpen(false);
    requestAnimationFrame(() => document.getElementById(`conv-${currentId}`)?.focus());
  }

  /** Fake the other side: delivered → typing → read → reply. */
  function simulate(thread: CareThread, sentId: string, text: string) {
    later(() => setCareStatus([sentId], "delivered"), 700);
    const responderId = isPatient ? thread.staffId : thread.patientId;
    const responderName = isPatient ? personInfo(thread.staffId).name : personInfo(thread.patientId, thread.patientName).name;
    schedule({
      conversationId: thread.id,
      name: responderName,
      onTypingStart: () => markCareSeen(thread.id, !isPatient),
      onReply: () =>
        sendCareMessage({
          threadId: thread.id,
          authorId: responderId,
          body: isPatient ? careTeamReply(text, thread.team) : patientReply(text),
          status: "delivered",
        }),
    });
  }

  function handleSend(body: string, attachments: ChatAttachment[]) {
    if (!current) return;
    const id = sendCareMessage({ threadId: current.id, authorId: me.meId, body, attachments });
    simulate(current, id, body || "attachment");
  }

  const partner = current ? (isPatient ? personInfo(current.staffId) : personInfo(current.patientId, current.patientName)) : undefined;
  const patient = current ? patientsById[current.patientId] : undefined;

  const list = (
    <>
      <div className="space-y-2 border-b border-border p-3">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <ListSearch value={q} onChange={setQ} label={isPatient ? "Search conversations" : "Search patients or topics"} />
          </div>
          {isPatient && (
            <button
              type="button"
              onClick={() => setNewOpen(true)}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground hover:bg-brand-800 dark:hover:bg-brand-300"
              aria-label="Start a new conversation"
            >
              <Plus className="size-5" aria-hidden />
            </button>
          )}
        </div>
        <div className="flex gap-1" role="group" aria-label="Filter conversations">
          {(
            [
              ["all", "All"],
              ["unread", "Unread"],
              ...(isPatient ? [] : ([["reply", "Needs reply"]] as const)),
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                filter === value ? "bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <nav aria-label="Conversations" className="min-h-0 flex-1 overflow-y-auto p-2">
        <ul className="space-y-0.5">
          {listed.map((t) => {
            const who = isPatient ? personInfo(t.staffId) : personInfo(t.patientId, t.patientName);
            const last = lastByThread[t.id];
            const Icon = topicMeta[t.topic].icon;
            const active = t.id === current?.id;
            return (
              <li key={t.id}>
                <button
                  id={`conv-${t.id}`}
                  type="button"
                  onClick={() => select(t.id)}
                  aria-current={active ? "true" : undefined}
                  className={cn("flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors", active ? "bg-brand-50 dark:bg-brand-950" : "hover:bg-muted")}
                >
                  <span className="relative">
                    <ChatAvatar name={who.name} src={who.avatar} size={40} />
                    <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-surface text-primary ring-1 ring-border">
                      <Icon className="size-3" aria-hidden />
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className={cn("flex-1 truncate text-sm", unread[t.id] ? "font-bold" : "font-semibold")}>{t.title}</span>
                      {last && <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(last.createdAt)}</span>}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{who.name}</span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <span className={cn("flex-1 truncate text-xs", unread[t.id] ? "font-semibold text-foreground" : "text-muted-foreground")}>
                        {last ? `${last.authorId === me.meId ? "You: " : ""}${last.body || (last.attachments?.length ? "Sent an attachment" : "")}` : "No messages yet"}
                      </span>
                      <UnreadBadge count={unread[t.id] ?? 0} />
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {listed.length === 0 && (
          <EmptyState
            compact
            image={sorted.length ? "/images/dashboard/empty-search.png" : "/images/dashboard/empty-messages.png"}
            title={sorted.length ? "No conversations match" : "No conversations yet"}
            description={sorted.length ? "Try another search or filter." : isPatient ? "Start one to ask your care team a question." : "Patient messages will show up here."}
          />
        )}
      </nav>
    </>
  );

  const conversation =
    current && partner ? (
      <>
        <header className="flex items-center gap-3 border-b border-border px-3 py-2.5 sm:px-5">
          <BackButton onClick={back} />
          <ChatAvatar name={partner.name} src={partner.avatar} size={38} />
          <div className="min-w-0 flex-1">
            <h2 ref={headingRef} tabIndex={-1} className="truncate text-base font-bold focus:outline-none">
              {current.title}
            </h2>
            <p className="truncate text-xs text-muted-foreground">
              {isPatient
                ? `With ${partner.name}${partner.title ? ` · ${partner.title}` : ""}`
                : `${partner.name}${patient ? ` · ${patient.mrn} · ${patient.condition}` : " · community member"}`}
            </p>
          </div>
          {current.refId &&
            (refHref(current.refId, me.role) ? (
              <Link
                href={refHref(current.refId, me.role)!}
                className="hidden shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:underline dark:bg-blue-950 dark:text-blue-200 sm:inline-block"
              >
                {current.refId}
              </Link>
            ) : (
              <span className="hidden shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold sm:inline-block">{current.refId}</span>
            ))}
        </header>

        <div role="note" className="flex items-center gap-2.5 border-b border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100 sm:px-5 sm:text-sm">
          <Image src="/images/icons/chat/emergency.png" alt="" width={32} height={32} className="size-7 shrink-0" />
          <p>
            <strong>Not for emergencies</strong> — call{" "}
            <a href={`tel:${site.emergencyPhone.replace(/[^+\d]/g, "")}`} className="font-bold underline">
              {site.emergencyPhone}
            </a>
            .
          </p>
        </div>

        <MessageLog key={current.id} label={`Messages: ${current.title}`} changeKey={`${convMessages.length}-${typing?.conversationId === current.id}`} sentKey={sentKey}>
          {convMessages.length === 0 && <EmptyState image="/images/dashboard/empty-messages.png" title="No messages yet" description="Say hello to start the conversation." />}
          {convMessages.map((m, i) => {
            const g = groupInfo(convMessages, i);
            return (
              <div key={m.id}>
                {g.newDay && <DaySeparator iso={m.createdAt} />}
                <CareMessageRow
                  msg={m}
                  mine={m.authorId === me.meId}
                  groupStart={g.groupStart || g.newDay}
                  groupEnd={g.groupEnd}
                  fallbackName={current.patientName}
                />
              </div>
            );
          })}
          {typing?.conversationId === current.id && <TypingIndicator name={typing.name} />}
        </MessageLog>

        <Composer
          label={`Message ${partner.name}`}
          placeholder={isPatient ? "Write to your care team…" : `Reply to ${partner.name.split(" ")[0]}…`}
          quickReplies={quickReplies[me.role]}
          onSend={handleSend}
        />
      </>
    ) : (
      <div className="grid flex-1 place-items-center">
        <EmptyState
          image="/images/dashboard/empty-messages.png"
          title={isPatient ? "Talk to your care team" : "No conversation selected"}
          description={isPatient ? "Ask about an appointment, an order, a prescription or your bill." : "Pick a conversation from the list."}
          action={isPatient ? <Button onClick={() => setNewOpen(true)}>Start a new conversation</Button> : undefined}
        />
      </div>
    );

  return (
    <>
      <ChatFrame
        eyebrow={isPatient ? "Private" : "Patient messages"}
        title={isPatient ? "Care chat" : "Patient messages"}
        description={
          isPatient
            ? "Private messages with your doctors, pharmacy and billing team."
            : me.role === "doctor"
              ? "Conversations with your patients."
              : me.role === "nurse"
                ? "Ward questions from patients in your department."
                : me.role === "pharmacist"
                  ? "Order and prescription questions from patients."
                  : "Insurance and billing questions from patients."
        }
        hideHeaderOnMobile={mobileOpen}
        actions={
          isPatient ? (
            <Button size="sm" onClick={() => setNewOpen(true)}>
              <Plus aria-hidden /> New conversation
            </Button>
          ) : undefined
        }
      >
        <PaneLayout list={list} conversation={conversation} showConversation={mobileOpen && !!current} />
      </ChatFrame>

      {isPatient && (
        <NewConversationDialog
          open={newOpen}
          onOpenChange={setNewOpen}
          onCreate={(c) => {
            const id = createCareThread({
              patientId: me.meId,
              title: c.title,
              topic: c.topic,
              refId: c.refId,
              firstMessage: { authorId: me.meId, body: c.message },
            });
            const thread = useChat.getState().careThreads.find((t) => t.id === id);
            const first = useChat.getState().careMessages.find((m) => m.threadId === id);
            select(id);
            toast.success("Conversation started", { description: `${personInfo(thread?.staffId ?? "").name} will reply soon.` });
            if (thread && first) simulate(thread, first.id, c.message);
          }}
        />
      )}
    </>
  );
}

function CareMessageRow({
  msg,
  mine,
  groupStart,
  groupEnd,
  fallbackName,
}: {
  msg: CareMessage;
  mine: boolean;
  groupStart: boolean;
  groupEnd: boolean;
  fallbackName?: string;
}) {
  if (msg.authorId === "system") {
    const moved = msg.body.startsWith("A care team member moved");
    return (
      <div className="my-4 flex justify-center">
        <div className="flex max-w-md items-start gap-3 rounded-2xl border border-border bg-surface-2 px-4 py-3 text-xs text-muted-foreground">
          {moved && <Image src="/images/dashboard/moved-to-private.png" alt="" width={56} height={56} className="size-12 shrink-0" />}
          <p className="whitespace-pre-wrap">
            {msg.body}
            <span className="mt-1 block text-[11px]">{formatTime(msg.createdAt)}</span>
          </p>
        </div>
      </div>
    );
  }

  const who = personInfo(msg.authorId, fallbackName);
  const staffTitle = staffById[msg.authorId]?.title;
  return (
    <div className={cn("flex gap-2.5", mine && "flex-row-reverse", groupStart ? "mt-4" : "mt-1")}>
      <div className="w-8 shrink-0">{groupStart && !mine && <ChatAvatar name={who.name} src={who.avatar} size={32} />}</div>
      <div className={cn("flex min-w-0 max-w-[85%] flex-col sm:max-w-[70%]", mine ? "items-end" : "items-start")}>
        {groupStart && (
          <p className={cn("mb-1 flex flex-wrap items-baseline gap-x-2 text-xs", mine && "flex-row-reverse")}>
            <span className="font-bold">{mine ? "You" : who.name}</span>
            {!mine && staffTitle && <span className="text-muted-foreground">{staffTitle}</span>}
            <time dateTime={msg.createdAt} className="text-muted-foreground">
              {formatTime(msg.createdAt)}
            </time>
          </p>
        )}
        <div
          title={new Date(msg.createdAt).toLocaleString()}
          className={cn(
            "min-w-0 rounded-2xl px-3.5 py-2 text-sm",
            mine ? "bg-primary text-primary-foreground" : "bg-surface-2",
            groupStart && (mine ? "rounded-tr-md" : "rounded-tl-md"),
          )}
        >
          {msg.body && <p className="whitespace-pre-wrap break-words">{msg.body}</p>}
          {msg.attachments && <AttachmentList items={msg.attachments} onDark={mine} />}
        </div>
        {mine && groupEnd && <Receipt status={msg.status} />}
      </div>
    </div>
  );
}

function Receipt({ status }: { status: CareMessage["status"] }) {
  const label = status === "read" ? "Seen" : status === "delivered" ? "Delivered" : "Sent";
  const Icon = status === "sent" ? Check : CheckCheck;
  return (
    <p className={cn("mt-1 flex items-center gap-1 text-[11px]", status === "read" ? "text-blue-600 dark:text-blue-300" : "text-muted-foreground")}>
      <Icon className="size-3.5" aria-hidden /> {label}
    </p>
  );
}
