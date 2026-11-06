"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { rollingDates } from "@/lib/persist";
import type { Role } from "@/config/navigation";
import {
  communityIcon,
  seedCareMessages,
  seedCareThreads,
  seedChannels,
  seedPosts,
  seedStaffMessages,
  seedTopics,
  type CareMessage,
  type CareTeam,
  type CareThread,
  type CareTopic,
  type ChatAttachment,
  type CommunityAuthor,
  type CommunityPost,
  type CommunityTopic,
  type DeliveryStatus,
  type Handover,
  type StaffChannel,
  type StaffMessage,
} from "@/data/chat";
import { patientsById } from "@/data/patients";
import { personaIds, staffById } from "@/data/staff";

/**
 * Chat store for staff chat, care chat and the community.
 * Read state is kept per user (staff id or patient id) and conversation id.
 */

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const now = () => new Date().toISOString();

/** Which care team handles a topic, and who picks it up by default. */
export function teamForTopic(topic: CareTopic): CareTeam {
  if (topic === "order" || topic === "prescription") return "pharmacy";
  if (topic === "billing") return "billing";
  return "doctor";
}

export function defaultStaffFor(team: CareTeam, patientId: string) {
  if (team === "nurse") return personaIds.nurse;
  if (team === "pharmacy") return personaIds.pharmacist;
  if (team === "billing") return personaIds.billing;
  return patientsById[patientId]?.doctorId ?? personaIds.doctor;
}

interface ChatState {
  channels: StaffChannel[];
  staffMessages: StaffMessage[];
  careThreads: CareThread[];
  careMessages: CareMessage[];
  topics: CommunityTopic[];
  posts: CommunityPost[];
  /** userId → conversationId → ISO time the user last read it. */
  lastRead: Record<string, Record<string, string>>;

  markRead: (userId: string, conversationId: string) => void;

  // staff chat
  sendStaffMessage: (input: {
    channelId: string;
    authorId: string;
    body: string;
    urgent?: boolean;
    handover?: Handover;
    attachments?: ChatAttachment[];
  }) => string;
  toggleReaction: (messageId: string, emoji: string, userId: string) => void;
  togglePin: (messageId: string) => void;
  openDm: (meId: string, otherId: string) => string;

  // care chat
  createCareThread: (input: {
    patientId: string;
    patientName?: string;
    title: string;
    topic: CareTopic;
    staffId?: string;
    /** Defaults to the team for the topic. */
    team?: CareTeam;
    refId?: string;
    firstMessage?: { authorId: string; body: string; attachments?: ChatAttachment[] };
  }) => string;
  sendCareMessage: (input: { threadId: string; authorId: string; body: string; attachments?: ChatAttachment[]; status?: DeliveryStatus }) => string;
  setCareStatus: (messageIds: string[], status: DeliveryStatus) => void;
  /** Mark every message in a thread NOT written by `readerIds` as read. */
  markCareSeen: (threadId: string, readerIsPatient: boolean) => void;

  // community
  createTopic: (input: { name: string; description: string; createdBy: string }) => string;
  updateTopic: (id: string, patch: Partial<Pick<CommunityTopic, "pinned" | "locked" | "archived">>) => void;
  addPost: (input: { topicId: string; author: CommunityAuthor; body: string }) => string;
  addReply: (postId: string, author: CommunityAuthor, body: string) => void;
  toggleLike: (postId: string, userId: string) => void;
  reportPost: (postId: string, reason: string, by: string) => void;
  setPostHidden: (postId: string, hidden: boolean) => void;
  movePostToPrivate: (postId: string, staff: { id: string; name: string; role: Role }) => string | null;

  reset: () => void;
}

function seed() {
  return {
    channels: seedChannels(),
    staffMessages: seedStaffMessages(),
    careThreads: seedCareThreads(),
    careMessages: seedCareMessages(),
    topics: seedTopics(),
    posts: seedPosts(),
    lastRead: {},
  };
}

export const useChat = create<ChatState>()(
  persist(
    (set, get) => ({
      ...seed(),

      markRead: (userId, conversationId) =>
        set((s) => ({ lastRead: { ...s.lastRead, [userId]: { ...s.lastRead[userId], [conversationId]: now() } } })),

      sendStaffMessage: ({ channelId, authorId, body, urgent, handover, attachments }) => {
        const id = uid("sm");
        const msg: StaffMessage = {
          id,
          channelId,
          authorId,
          body,
          createdAt: now(),
          type: handover ? "handover" : "text",
          urgent,
          handover,
          attachments: attachments?.length ? attachments : undefined,
          reactions: {},
        };
        set((s) => ({
          staffMessages: [...s.staffMessages, msg],
          lastRead: { ...s.lastRead, [authorId]: { ...s.lastRead[authorId], [channelId]: msg.createdAt } },
        }));
        return id;
      },

      toggleReaction: (messageId, emoji, userId) =>
        set((s) => ({
          staffMessages: s.staffMessages.map((m) => {
            if (m.id !== messageId) return m;
            const who = m.reactions[emoji] ?? [];
            const next = who.includes(userId) ? who.filter((x) => x !== userId) : [...who, userId];
            const reactions = { ...m.reactions, [emoji]: next };
            if (!next.length) delete reactions[emoji];
            return { ...m, reactions };
          }),
        })),

      togglePin: (messageId) =>
        set((s) => ({ staffMessages: s.staffMessages.map((m) => (m.id === messageId ? { ...m, pinned: !m.pinned } : m)) })),

      openDm: (meId, otherId) => {
        const id = `dm-${[meId, otherId].sort().join("--")}`;
        if (!get().channels.some((c) => c.id === id)) {
          set((s) => ({
            channels: [...s.channels, { id, kind: "dm", name: "", topic: "", memberIds: [meId, otherId], seedReadAt: now() }],
          }));
        }
        return id;
      },

      createCareThread: ({ patientId, patientName, title, topic, staffId, team: teamIn, refId, firstMessage }) => {
        const id = uid("ct");
        const team = teamIn ?? teamForTopic(topic);
        const at = now();
        const thread: CareThread = {
          id,
          patientId,
          patientName,
          title,
          topic,
          team,
          staffId: staffId ?? defaultStaffFor(team, patientId),
          refId,
          createdAt: at,
          seedReadAt: { patient: at, staff: at },
        };
        const msgs: CareMessage[] = firstMessage
          ? [{ id: uid("cm"), threadId: id, createdAt: at, status: "sent", ...firstMessage }]
          : [];
        set((s) => ({ careThreads: [thread, ...s.careThreads], careMessages: [...s.careMessages, ...msgs] }));
        return id;
      },

      sendCareMessage: ({ threadId, authorId, body, attachments, status = "sent" }) => {
        const id = uid("cm");
        const msg: CareMessage = {
          id,
          threadId,
          authorId,
          body,
          createdAt: now(),
          attachments: attachments?.length ? attachments : undefined,
          status,
        };
        set((s) => ({
          careMessages: [...s.careMessages, msg],
          lastRead: { ...s.lastRead, [authorId]: { ...s.lastRead[authorId], [threadId]: msg.createdAt } },
        }));
        return id;
      },

      setCareStatus: (ids, status) =>
        set((s) => ({ careMessages: s.careMessages.map((m) => (ids.includes(m.id) ? { ...m, status } : m)) })),

      markCareSeen: (threadId, readerIsPatient) => {
        const thread = get().careThreads.find((t) => t.id === threadId);
        if (!thread) return;
        const needs = get().careMessages.some(
          (m) => m.threadId === threadId && m.status !== "read" && (m.authorId === thread.patientId) !== readerIsPatient && m.authorId !== "system",
        );
        if (!needs) return;
        set((s) => ({
          careMessages: s.careMessages.map((m) =>
            m.threadId === threadId && m.authorId !== "system" && (m.authorId === thread.patientId) !== readerIsPatient
              ? { ...m, status: "read" }
              : m,
          ),
        }));
      },

      createTopic: ({ name, description, createdBy }) => {
        const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "topic";
        const id = get().topics.some((t) => t.id === base) ? `${base}-${Math.floor(Math.random() * 1000)}` : base;
        const topic: CommunityTopic = {
          id,
          name,
          description,
          icon: communityIcon("custom"),
          custom: true,
          createdBy,
          createdAt: now(),
          members: 1,
        };
        set((s) => ({ topics: [...s.topics, topic] }));
        return id;
      },

      updateTopic: (id, patch) => set((s) => ({ topics: s.topics.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),

      addPost: ({ topicId, author, body }) => {
        const id = uid("cp");
        const post: CommunityPost = { id, topicId, author, body, createdAt: now(), likes: 0, likedBy: [], replies: [], reports: [] };
        set((s) => ({ posts: [...s.posts, post] }));
        return id;
      },

      addReply: (postId, author, body) =>
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id === postId ? { ...p, replies: [...p.replies, { id: uid("cr"), author, body, createdAt: now() }] } : p,
          ),
        })),

      toggleLike: (postId, userId) =>
        set((s) => ({
          posts: s.posts.map((p) => {
            if (p.id !== postId) return p;
            const liked = p.likedBy.includes(userId);
            return {
              ...p,
              likes: p.likes + (liked ? -1 : 1),
              likedBy: liked ? p.likedBy.filter((x) => x !== userId) : [...p.likedBy, userId],
            };
          }),
        })),

      reportPost: (postId, reason, by) =>
        set((s) => ({
          posts: s.posts.map((p) => (p.id === postId ? { ...p, reports: [...p.reports, { reason, by, at: now() }] } : p)),
        })),

      setPostHidden: (postId, hidden) =>
        set((s) => ({ posts: s.posts.map((p) => (p.id === postId ? { ...p, hidden } : p)) })),

      movePostToPrivate: (postId, staff) => {
        const post = get().posts.find((p) => p.id === postId);
        if (!post || post.author.kind !== "patient") return null;
        const topic = get().topics.find((t) => t.id === post.topicId);
        const careTopic: CareTopic =
          staff.role === "pharmacist" ? "prescription" : staff.role === "billing" ? "billing" : "other";
        // A nurse keeps the chat in the nurse team so they can follow it up themselves.
        const team: CareTeam = staff.role === "nurse" ? "nurse" : teamForTopic(careTopic);
        const staffId = team === "doctor" && staff.role !== "doctor" ? defaultStaffFor(team, post.author.id) : staff.id;
        const known = !!patientsById[post.author.id];
        const threadId = get().createCareThread({
          patientId: post.author.id,
          patientName: known ? undefined : post.author.name,
          title: `From community: ${topic?.name ?? "post"}`,
          topic: careTopic,
          team,
          staffId,
        });
        const at = Date.now();
        const stamp = (offset: number) => new Date(at + offset).toISOString();
        const msgs: CareMessage[] = [
          {
            id: uid("cm"),
            threadId,
            authorId: "system",
            body: `A care team member moved your community post here so you can talk in private.\n\n"${post.body}"`,
            createdAt: stamp(0),
            status: "read",
          },
          {
            id: uid("cm"),
            threadId,
            authorId: staff.id,
            body: `Hi, this is ${staff.name}. Thanks for your post. It's better to talk about this here, where only you and your care team can see it. How are you feeling today?`,
            createdAt: stamp(1000),
            status: "delivered",
          },
        ];
        set((s) => ({
          careMessages: [...s.careMessages, ...msgs],
          posts: s.posts.map((p) => (p.id === postId ? { ...p, movedTo: { threadId, by: staff.name, at: now() } } : p)),
          lastRead: { ...s.lastRead, [staff.id]: { ...s.lastRead[staff.id], [threadId]: stamp(2000) } },
        }));
        return threadId;
      },

      reset: () => set(seed()),
    }),
    {
      name: "aurelia-chat",
      version: 2,
      storage: rollingDates(),
      // v2: channels got membership rules (`open`, new memberIds) and nurses got care threads.
      migrate: (persisted, version) => {
        const state = persisted as ChatState;
        if (version < 2) {
          const saved = new Map((state.channels ?? []).map((c) => [c.id, c]));
          const seeded = seedChannels();
          const seededIds = new Set(seeded.map((c) => c.id));
          state.channels = [
            ...seeded.map((c) => ({ ...c, seedReadAt: saved.get(c.id)?.seedReadAt ?? c.seedReadAt })),
            ...(state.channels ?? []).filter((c) => !seededIds.has(c.id)),
          ];
          const known = new Set((state.careThreads ?? []).map((t) => t.id));
          const added = seedCareThreads().filter((t) => !known.has(t.id));
          const addedIds = new Set(added.map((t) => t.id));
          state.careThreads = [...(state.careThreads ?? []), ...added];
          state.careMessages = [...(state.careMessages ?? []), ...seedCareMessages().filter((m) => addedIds.has(m.threadId))];
        }
        return state;
      },
    },
  ),
);

/* --------------------------------------------------------------- selectors */

/** Time a user last read a conversation, falling back to the seed time. */
export function readAt(lastRead: ChatState["lastRead"], userId: string, conversationId: string, seedReadAt: string) {
  return lastRead[userId]?.[conversationId] ?? seedReadAt;
}

/** Staff conversations a staff member can see: open channels, channels they belong to, and their DMs. */
export function visibleChannels(channels: StaffChannel[], meId: string) {
  return channels.filter((c) => (c.kind === "channel" && c.open) || c.memberIds.includes(meId));
}

export function staffUnreadByChannel(state: Pick<ChatState, "channels" | "staffMessages" | "lastRead">, meId: string) {
  const counts: Record<string, number> = {};
  const visible = visibleChannels(state.channels, meId);
  const since = Object.fromEntries(visible.map((c) => [c.id, readAt(state.lastRead, meId, c.id, c.seedReadAt)]));
  for (const m of state.staffMessages) {
    const at = since[m.channelId];
    if (at && m.authorId !== meId && m.createdAt > at) counts[m.channelId] = (counts[m.channelId] ?? 0) + 1;
  }
  return counts;
}

/** Care threads a user sees: the patient's own threads, or the staff member's inbox. */
export function visibleCareThreads(threads: CareThread[], role: Role, meId: string) {
  if (role === "patient") return threads.filter((t) => t.patientId === meId);
  if (role === "doctor")
    return threads.filter((t) => t.staffId === meId || (t.team === "doctor" && patientsById[t.patientId]?.doctorId === meId));
  if (role === "nurse") {
    // Nurse-team threads they own, or for patients in their department.
    const department = staffById[meId]?.department;
    return threads.filter((t) => t.team === "nurse" && (t.staffId === meId || patientsById[t.patientId]?.department === department));
  }
  if (role === "pharmacist") return threads.filter((t) => t.team === "pharmacy");
  if (role === "billing") return threads.filter((t) => t.team === "billing");
  return [];
}

export function careUnreadByThread(state: Pick<ChatState, "careThreads" | "careMessages" | "lastRead">, role: Role, meId: string) {
  const counts: Record<string, number> = {};
  const isPatient = role === "patient";
  const threads = visibleCareThreads(state.careThreads, role, meId);
  const since = Object.fromEntries(
    threads.map((t) => [t.id, { at: readAt(state.lastRead, meId, t.id, isPatient ? t.seedReadAt.patient : t.seedReadAt.staff), patientId: t.patientId }]),
  );
  for (const m of state.careMessages) {
    const info = since[m.threadId];
    if (!info || m.createdAt <= info.at) continue;
    const fromOtherSide = isPatient ? m.authorId !== meId : m.authorId === info.patientId;
    if (fromOtherSide) counts[m.threadId] = (counts[m.threadId] ?? 0) + 1;
  }
  return counts;
}

/**
 * Total unread for a nav badge. Usage (component):
 * `const total = useChatUnread(role, "staff")` from components/chat/use-chat-unread.ts.
 */
export function sumCounts(counts: Record<string, number>) {
  return Object.values(counts).reduce((a, b) => a + b, 0);
}
