"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { roles } from "@/config/navigation";
import { site } from "@/config/site";
import type { CareTeam } from "@/data/chat";
import { DEMO_PATIENT_ID, patientsById } from "@/data/patients";
import { personaIds, staffById } from "@/data/staff";
import { formatDay } from "@/lib/dates";
import { useSession } from "@/store/session";

/** Who is chatting: the signed-in role's persona (staff) or the demo patient. */
export function useChatIdentity() {
  const role = useSession((s) => s.role) ?? "patient";
  const profile = useSession((s) => s.profile);
  const persona = roles.find((r) => r.id === role)!;
  const isStaff = role !== "patient";
  const meId = isStaff ? personaIds[role] : DEMO_PATIENT_ID;
  return {
    role,
    meId,
    isStaff,
    name: profile?.name || persona.person,
    avatar: persona.avatar,
    title: isStaff ? staffById[meId]?.title : undefined,
  };
}

export interface PersonInfo {
  name: string;
  avatar?: string;
  title?: string;
}

/** Name/avatar for a staff id, patient id or "system". */
export function personInfo(id: string, fallbackName?: string): PersonInfo {
  const s = staffById[id];
  if (s) return { name: s.name, avatar: s.avatar, title: s.title };
  const p = patientsById[id];
  if (p) return { name: p.name, avatar: p.avatar, title: `Patient · ${p.mrn}` };
  if (id === "system") return { name: site.name };
  return { name: fallbackName ?? "Community member", title: "Patient" };
}

/* --------------------------------------------------------------- grouping */

const dayKey = (iso: string) => new Date(iso).toDateString();

export function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return formatDay(iso);
}

/** For message i: start a new day? start a new author group? */
export function groupInfo<T extends { authorId: string; createdAt: string; type?: string }>(list: T[], i: number) {
  const cur = list[i];
  const prev = list[i - 1];
  const next = list[i + 1];
  const newDay = !prev || dayKey(prev.createdAt) !== dayKey(cur.createdAt);
  const close = (a?: T, b?: T) =>
    !!a &&
    !!b &&
    a.authorId === b.authorId &&
    dayKey(a.createdAt) === dayKey(b.createdAt) &&
    Math.abs(new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) < 6 * 60_000 &&
    a.type !== "handover" &&
    b.type !== "handover";
  return { newDay, groupStart: !close(prev, cur), groupEnd: !close(cur, next) };
}

/** Id of the newest item the current user wrote. Pass it to MessageLog `sentKey`. */
export function lastMineId<T extends { id: string }>(list: T[], isMine: (item: T) => boolean) {
  for (let i = list.length - 1; i >= 0; i--) if (isMine(list[i])) return list[i].id;
  return undefined;
}

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/* ------------------------------------------------------- mention tokens */

export const MENTION_RE = /@\[patient:([a-z0-9-]+)\]/g;

/** Plain text of a message with patient tokens replaced by names (for search and previews). */
export function plainText(body: string) {
  return body.replace(MENTION_RE, (_, id: string) => `@${patientsById[id]?.name ?? "patient"}`);
}

/* --------------------------------------------------------- canned replies */

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
const has = (text: string, words: string) => new RegExp(`\\b(${words})`, "i").test(text);

/** Reply from a colleague in staff chat. */
export function staffReply(text: string, urgent?: boolean) {
  if (urgent || has(text, "urgent|stat|asap|now")) return pick(["On my way. Two minutes.", "Coming now. Please stay with the patient.", "Seen. I'm heading over."]);
  if (has(text, "handover|sbar")) return "Got the handover, thanks. I'll take it from here.";
  if (has(text, "bed|admit|transfer|discharge")) return pick(["Bed 9 on 4B is free. I'll tell the desk.", "I'll check the bed board and come back to you."]);
  if (has(text, "lab|result|troponin|blood|ecg|cbc")) return "I'll chase the lab and post the result here.";
  if (has(text, "dose|mg|medic|rx|prescri|drug|allerg")) return "Checked. The dose looks fine. Go ahead.";
  if (has(text, "insur|claim|approv|card|bill")) return "I'll check with the insurer and update you today.";
  if (has(text, "cover|shift|break|roster")) return "I can cover that. 👍";
  if (has(text, "thank|thx|great")) return pick(["Anytime!", "No problem. 👍", "Happy to help."]);
  if (text.trim().endsWith("?")) return pick(["Good question. Let me check and come back to you.", "I think so, but I'll confirm in 10 min."]);
  return pick(["Got it, thanks.", "Noted. I'll follow up.", "Sounds good.", "Okay, I'll take a look."]);
}

/** Reply from the care team to a patient. Short, safe, never a diagnosis. */
export function careTeamReply(text: string, team: CareTeam) {
  if (has(text, "chest|breath|faint|bleed|emergenc|severe|suicid|unsafe"))
    return `Please don't wait for chat with this. If it's severe, call ${site.emergencyPhone} now. Otherwise, I'll ask a nurse to call you today.`;
  if (team === "pharmacy") {
    if (has(text, "order|deliver|ship|arriv|courier")) return "Your order is on its way. You'll get a text when the courier is close.";
    if (has(text, "refill|prescri|rx|photo")) return "I can help with that. If you have a new prescription, please attach a clear photo here.";
    if (has(text, "side effect|dizzy|rash|sick")) return "Thanks for telling us. Please don't stop the medicine on your own. I'll ask your doctor and reply today.";
    return "Thanks! I'll check this with the pharmacy team and reply soon.";
  }
  if (team === "billing") {
    if (has(text, "claim|insur|cover|card")) return "I checked your plan. I'll send the claim today and update you here.";
    if (has(text, "pay|bill|invoice|cost|price|discount")) return "I'll send you a breakdown of the costs today. No payment is due yet.";
    return "Thanks for your message. I'll look into it and get back to you today.";
  }
  if (has(text, "bp|pressure|reading")) return "Thanks for the readings. Keep logging them and bring the log to your visit.";
  if (has(text, "appointment|reschedul|book|visit|time")) return "You can change the time under Appointments. Let me know if you need help.";
  if (has(text, "result|test|lab")) return "I'll review your results and write to you here by tomorrow.";
  if (has(text, "thank")) return "You're welcome. Take care!";
  return "Thanks for your message. I'll get back to you soon.";
}

/** Reply from a (simulated) patient to the care team. */
export function patientReply(text: string) {
  if (has(text, "upload|photo|attach")) return "Sure, I'll send a clearer photo tonight.";
  if (has(text, "book|follow-up|visit|appointment")) return "Okay, I'll book it today.";
  if (has(text, "approved|ready|verified|shipped")) return "That's great news, thank you!";
  if (text.trim().endsWith("?")) return pick(["Yes, I'm feeling a bit better today.", "Not yet, I'll check and tell you."]);
  return pick(["Thank you!", "Okay, I'll do that.", "Great, thanks for letting me know.", "Thanks, that helps a lot."]);
}

/* -------------------------------------------------------- simulated life */

/**
 * Schedules a fake "typing…" then a reply 1.5–3 s after a send.
 * All timers are cleared on unmount.
 */
export function useSimulatedReply() {
  const timers = useRef<number[]>([]);
  const [typing, setTyping] = useState<{ conversationId: string; name: string } | null>(null);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((t) => window.clearTimeout(t));
  }, []);

  const schedule = useCallback(
    (opts: { conversationId: string; name: string; onTypingStart?: () => void; onReply: () => void }) => {
      const total = 1500 + Math.random() * 1500;
      timers.current.push(
        window.setTimeout(() => {
          setTyping({ conversationId: opts.conversationId, name: opts.name });
          opts.onTypingStart?.();
        }, 500),
        window.setTimeout(() => {
          setTyping(null);
          opts.onReply();
        }, total),
      );
    },
    [],
  );

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  return { typing, schedule, later };
}

/** True below the md breakpoint (one pane at a time). */
export function isSmallScreen() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
}
