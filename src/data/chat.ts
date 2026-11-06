/**
 * Seed data for the three chat spaces: staff chat (channels + DMs),
 * care chat (patient ↔ care team threads) and the community.
 * Everything is generated relative to "now" so the demo never looks stale.
 * Patient mentions inside staff messages use the token `@[patient:<id>]`.
 */

import { DEMO_PATIENT_ID } from "./patients";

/* ------------------------------------------------------------------ types */

export interface ChatAttachment {
  name: string;
  /** Size in bytes. */
  size: number;
  kind: "image" | "file";
  /** Object URL for images picked in this session (not valid after reload). */
  url?: string;
}

export interface Handover {
  patientId: string;
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
}

export interface StaffChannel {
  id: string;
  kind: "channel" | "dm";
  /** Channel name without "#", or empty for DMs. */
  name: string;
  topic: string;
  /** Staff ids. For DMs exactly two people. Only members see a channel unless it is `open`. */
  memberIds: string[];
  /** Hospital-wide channel every staff member can see (e.g. #announcements). */
  open?: boolean;
  /** Only admins can post (announcements). */
  readOnly?: boolean;
  /** Messages before this time count as read for everyone (seed only). */
  seedReadAt: string;
}

export interface StaffMessage {
  id: string;
  channelId: string;
  authorId: string;
  body: string;
  createdAt: string;
  type: "text" | "handover";
  urgent?: boolean;
  pinned?: boolean;
  handover?: Handover;
  attachments?: ChatAttachment[];
  /** emoji → staff ids who reacted. */
  reactions: Record<string, string[]>;
}

export type CareTopic = "appointment" | "order" | "billing" | "prescription" | "other";
export type CareTeam = "doctor" | "nurse" | "pharmacy" | "billing";

export interface CareThread {
  id: string;
  patientId: string;
  /** Fallback name when the patient is not in the patient list (e.g. a community member). */
  patientName?: string;
  title: string;
  topic: CareTopic;
  team: CareTeam;
  /** Main care team member on this thread. */
  staffId: string;
  /** Linked appointment or order, e.g. "APT-21140" or "ORD-52210". */
  refId?: string;
  createdAt: string;
  seedReadAt: { patient: string; staff: string };
}

export type DeliveryStatus = "sent" | "delivered" | "read";

export interface CareMessage {
  id: string;
  threadId: string;
  /** Patient id, staff id or "system". */
  authorId: string;
  body: string;
  createdAt: string;
  attachments?: ChatAttachment[];
  status: DeliveryStatus;
}

export interface CommunityAuthor {
  kind: "patient" | "staff";
  /** Patient id, staff id, or a made-up member id. */
  id: string;
  /** Nickname for patients, real name for staff. */
  name: string;
  avatar?: string;
  /** Staff job title. */
  title?: string;
}

export interface CommunityTopic {
  id: string;
  name: string;
  description: string;
  icon: string;
  custom?: boolean;
  createdBy: string;
  createdAt: string;
  members: number;
  pinned?: boolean;
  locked?: boolean;
  archived?: boolean;
}

export interface CommunityReply {
  id: string;
  author: CommunityAuthor;
  body: string;
  createdAt: string;
}

export interface CommunityReport {
  reason: string;
  by: string;
  at: string;
}

export interface CommunityPost {
  id: string;
  topicId: string;
  author: CommunityAuthor;
  body: string;
  createdAt: string;
  likes: number;
  likedBy: string[];
  replies: CommunityReply[];
  reports: CommunityReport[];
  hidden?: boolean;
  /** Set when staff moved the post to a private care chat. */
  movedTo?: { threadId: string; by: string; at: string };
}

/* ---------------------------------------------------------------- helpers */

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
const H = 60;
const D = 24 * 60;

export const nickAvatar = (n: number) => `/images/dashboard/nick-avatar-0${n}.png`;
export const communityIcon = (name: string) => `/images/icons/community/${name}.png`;

/* -------------------------------------------------------------- staff chat */

export function seedChannels(): StaffChannel[] {
  const ch = (id: string, name: string, topic: string, memberIds: string[], readMin: number, extra: Partial<StaffChannel> = {}): StaffChannel => ({
    id,
    kind: "channel",
    name,
    topic,
    memberIds,
    seedReadAt: ago(readMin),
    ...extra,
  });
  const dm = (a: string, b: string, readMin: number): StaffChannel => ({
    id: `dm-${[a, b].sort().join("--")}`,
    kind: "dm",
    name: "",
    topic: "",
    memberIds: [a, b],
    seedReadAt: ago(readMin),
  });

  return [
    ch("announcements", "announcements", "Hospital news from the admin team. Read only.", ["elena-varga", "luis-ortega"], 3 * H, { readOnly: true, open: true }),
    ch("cardiology", "cardiology", "Cardiology team: doctors, nurses and pharmacy.", ["layla-haddad", "thomas-weber", "sam-okafor", "grace-lee", "tom-baker", "kenji-mori"], 50),
    ch("ward-4b", "ward-4b", "Cardiac ward 4B: beds, handovers and daily jobs.", ["sam-okafor", "grace-lee", "tom-baker", "layla-haddad"], 20),
    ch("icu", "icu", "Intensive care beds and transfers.", ["aisha-bello", "grace-adeyemi", "marcus-bennett", "diego-ramirez", "elena-varga"], 2 * H),
    ch("emergency", "emergency", "ER flow, incoming patients and bed requests.", ["noah-fischer", "sam-okafor", "aisha-bello", "layla-haddad", "luis-ortega"], 30),
    ch("pharmacy", "pharmacy", "Prescriptions, stock and lab updates.", ["kenji-mori", "ben-carter", "david-cho", "nadia-hussain", "layla-haddad", "sam-okafor"], 45),
    ch("billing-desk", "billing-desk", "Insurance checks, claims and pre-approvals.", ["priya-nair", "rachel-adams", "elena-varga"], 70),
    dm("layla-haddad", "sam-okafor", 30),
    dm("layla-haddad", "kenji-mori", 4 * H),
    dm("layla-haddad", "marcus-bennett", 90),
    dm("layla-haddad", "priya-nair", 3 * H),
    dm("sam-okafor", "grace-lee", 10),
    dm("sam-okafor", "elena-varga", 5 * H),
    dm("kenji-mori", "david-cho", 15),
    dm("kenji-mori", "sam-okafor", 2 * H),
    dm("priya-nair", "rachel-adams", 25),
    dm("priya-nair", "elena-varga", 6 * H),
    dm("elena-varga", "luis-ortega", 35),
  ];
}

export function seedStaffMessages(): StaffMessage[] {
  let n = 0;
  const m = (channelId: string, authorId: string, minAgo: number, body: string, extra: Partial<StaffMessage> = {}): StaffMessage => ({
    id: `sm-${++n}`,
    channelId,
    authorId,
    body,
    createdAt: ago(minAgo),
    type: "text",
    reactions: {},
    ...extra,
  });
  const dmId = (a: string, b: string) => `dm-${[a, b].sort().join("--")}`;

  return [
    // #announcements
    m("announcements", "elena-varga", 3 * D, "Welcome to staff chat. Keep patient details inside staff channels only, never in Community.", { pinned: true, reactions: { "👍": ["sam-okafor", "layla-haddad", "priya-nair"] } }),
    m("announcements", "elena-varga", 2 * D + 2 * H, "Fire drill on Thursday at 10:00 in Block C. Wards 4B and 3C stay on normal duty."),
    m("announcements", "luis-ortega", D + 5 * H, "Parking level 2 is closed for cleaning tomorrow from 06:00 to 12:00."),
    m("announcements", "elena-varga", D + 3 * H, "New badge readers go live on Monday. Please test your badge at the main entrance this week."),
    m("announcements", "elena-varga", 5 * H, "Flu vaccine clinic for staff: today and tomorrow, 11:00–15:00, room G12. Walk in, no booking.", { reactions: { "💉": ["grace-lee"], "👍": ["kenji-mori", "rachel-adams"] } }),
    m("announcements", "luis-ortega", 40, "Great work, everyone: last week's patient survey score was 4.9 out of 5. 🎉", { reactions: { "🎉": ["sam-okafor", "grace-lee", "layla-haddad", "aisha-bello"] } }),

    // #cardiology
    m("cardiology", "layla-haddad", 4 * D, "Cardiology on-call this week: Dr. Haddad (days), Dr. Weber (nights). Pager 4400.", { pinned: true }),
    m("cardiology", "layla-haddad", D + 6 * H, "Cath lab list for tomorrow is up. 3 cases, first one at 08:00."),
    m("cardiology", "tom-baker", D + 4 * H, "@[patient:rosa-delgado] walked 200 m today with no chest pain.", { reactions: { "👍": ["layla-haddad", "sam-okafor"] } }),
    m("cardiology", "layla-haddad", D + 4 * H - 10, "Great. Plan discharge for Thursday if her bloods stay stable."),
    m("cardiology", "sam-okafor", 4 * H, "@[patient:ahmed-saleh] admitted with chest pain, troponin pending. NEWS 7. Can a doctor review now?", { urgent: true }),
    m("cardiology", "layla-haddad", 4 * H - 5, "On my way. Please repeat the ECG and start the chest pain pathway. Note: aspirin allergy."),
    m("cardiology", "kenji-mori", 4 * H - 12, "Flagging the aspirin allergy for @[patient:ahmed-saleh]. If he needs an antiplatelet, I suggest clopidogrel. Dose check done.", { reactions: { "🙏": ["layla-haddad"] } }),
    m("cardiology", "grace-lee", 3 * H + 40, "Repeat ECG done and uploaded. Troponin sent at 07:20.", { attachments: [{ name: "ecg-saleh-0715.pdf", size: 284_000, kind: "file" }] }),
    m("cardiology", "layla-haddad", 3 * H + 30, "Thanks. Team review at 08:30 by his bed."),
    m("cardiology", "grace-lee", 70, "@[patient:james-whitaker] weight is down 1.2 kg since yesterday. Still on 2 L oxygen."),
    m("cardiology", "layla-haddad", 35, "Good progress. Let's try room air this afternoon and check SpO2 every 2 hours."),
    m("cardiology", "thomas-weber", 12, "I'll be in from 19:00 tonight. Send me anything that needs a look before then."),

    // #ward-4b
    m("ward-4b", "tom-baker", D + 9 * H, "Visiting hours are busy today. Please remind families: max 2 visitors per bed."),
    m("ward-4b", "sam-okafor", D + 2 * H, "Supply room is low on IV giving sets. I've ordered more for tomorrow."),
    m("ward-4b", "tom-baker", 5 * H, "Night handover for bed 03.", {
      type: "handover",
      handover: {
        patientId: "ahmed-saleh",
        situation: "Chest pain since 05:30, NEWS 7. HR 118, BP 96/60.",
        background: "72 y/o, known angina. Allergic to aspirin.",
        assessment: "Possible heart attack. Troponin pending, ECG shows ST changes.",
        recommendation: "Doctor review now. Repeat troponin at 3 h. Obs every 30 min.",
      },
    }),
    m("ward-4b", "tom-baker", 5 * H - 3, "Night handover for bed 12.", {
      type: "handover",
      handover: {
        patientId: "james-whitaker",
        situation: "Heart failure, more breathless overnight. SpO2 93% on 2 L.",
        background: "67 y/o, admitted 2 days ago with fluid overload.",
        assessment: "Slowly improving. Good urine output after IV furosemide.",
        recommendation: "Daily weight, fluid balance chart, try room air if SpO2 stays above 94%.",
      },
      reactions: { "✅": ["sam-okafor"] },
    }),
    m("ward-4b", "sam-okafor", 4 * H + 50, "Thanks Tom. Bed 9 is being cleaned and will be ready by 10:00."),
    m("ward-4b", "grace-lee", 2 * H, "Can someone cover my break at 12:30?"),
    m("ward-4b", "sam-okafor", 2 * H - 4, "I've got you. 👍"),
    m("ward-4b", "layla-haddad", 50, "Ward round moved to 14:00 today. Please have the obs charts ready."),
    m("ward-4b", "grace-lee", 15, "@[patient:rosa-delgado] is asking about her discharge paperwork. Who can help?"),

    // #icu
    m("icu", "aisha-bello", 6 * H, "ICU has 2 free beds right now."),
    m("icu", "marcus-bennett", 5 * H, "@[patient:peter-novak] is post thrombolysis. He may need an ICU bed if his BP stays above 180."),
    m("icu", "aisha-bello", 5 * H - 8, "Bed 6 is reserved for him. Tell me when you want to move him."),
    m("icu", "diego-ramirez", 3 * H, "@[patient:samuel-reyes] is stable after surgery and stays on the ward."),
    m("icu", "aisha-bello", 100, "Ventilator 3 is showing an error. Biomed is on the way. Using the spare.", { urgent: true }),
    m("icu", "elena-varga", 95, "Thanks Aisha, I've logged it with Biomed and asked for a loan unit."),
    m("icu", "grace-adeyemi", 20, "Morning ICU round done. All patients stable."),

    // #emergency
    m("emergency", "noah-fischer", 8 * H, "ER is busy this morning: 14 waiting, average wait 35 min."),
    m("emergency", "noah-fischer", 4 * H + 30, "Sending up @[patient:ahmed-saleh] to 4B, bed 03. ECG attached.", { attachments: [{ name: "er-ecg-0640.pdf", size: 198_000, kind: "file" }] }),
    m("emergency", "sam-okafor", 4 * H + 20, "Bed 03 ready. We'll take him now."),
    m("emergency", "luis-ortega", 2 * H, "Extra nurse from the bank is coming to ER at 12:00."),
    m("emergency", "noah-fischer", 25, "Ambulance on the way with a possible stroke, ETA 10 min. Stroke team please stand by.", { urgent: true }),
    m("emergency", "aisha-bello", 18, "ICU is aware. Bed 6 can take him if needed."),

    // #pharmacy
    m("pharmacy", "kenji-mori", 2 * D, "Reminder: the new atorvastatin packs look different. Same drug, same dose.", { pinned: true }),
    m("pharmacy", "kenji-mori", 6 * H, "Rx queue: 6 to verify this morning. Ward orders first."),
    m("pharmacy", "david-cho", 5 * H, "Lab: CBC for @[patient:victor-hale] is processing. Results in about 40 min."),
    m("pharmacy", "sam-okafor", 4 * H, "Can we get the 14:00 meds for 4B a bit earlier? We have 2 discharges."),
    m("pharmacy", "kenji-mori", 4 * H - 6, "Sure, they'll be up by 13:15."),
    m("pharmacy", "david-cho", 3 * H, "Thyroid panel for @[patient:chloe-martin] collected at 08:35."),
    m("pharmacy", "layla-haddad", 60, "Kenji, can you check interactions for @[patient:james-whitaker]? I'm adding spironolactone."),
    m("pharmacy", "kenji-mori", 40, "Checked. OK with his kidney function. Please check potassium in 3 days.", { reactions: { "🙏": ["layla-haddad"] } }),
    m("pharmacy", "ben-carter", 22, "Stock count for controlled drugs at 16:00 today. Two people needed."),

    // #billing-desk
    m("billing-desk", "priya-nair", 6 * H, "3 insurance cards are waiting for checks. I'll take Northwind and Cobalt."),
    m("billing-desk", "rachel-adams", 6 * H - 10, "I'll do BrightPath. Their portal is slow today."),
    m("billing-desk", "priya-nair", 3 * H, "Pre-approval for @[patient:victor-hale] knee rehab is approved. ✅", { reactions: { "🎉": ["rachel-adams"] } }),
    m("billing-desk", "rachel-adams", 2 * H, "@[patient:george-okoro] has no insurance on file. Should I call him?"),
    m("billing-desk", "priya-nair", 2 * H - 5, "Yes please, and offer the self-pay discount."),
    m("billing-desk", "elena-varga", 50, "Monthly claim report is due on Friday. Thanks, both!"),
    m("billing-desk", "rachel-adams", 30, "Northwind rejected one claim for a missing code. I'm fixing it now."),

    // DMs
    m(dmId("layla-haddad", "sam-okafor"), "sam-okafor", 75, "Ahmed Saleh's BP just dropped to 96/60.", { urgent: true }),
    m(dmId("layla-haddad", "sam-okafor"), "layla-haddad", 73, "Start a 250 ml fluid bolus. I'm coming now."),
    m(dmId("layla-haddad", "sam-okafor"), "sam-okafor", 60, "Done. BP 108/68 now. I'll recheck in 15 min."),
    m(dmId("layla-haddad", "sam-okafor"), "sam-okafor", 20, "Repeat troponin is back. I put it in his chart."),
    m(dmId("layla-haddad", "kenji-mori"), "kenji-mori", 5 * H, "Your Rx for Maya Robinson, amlodipine 5 mg, is approved."),
    m(dmId("layla-haddad", "kenji-mori"), "layla-haddad", 5 * H - 20, "Thanks Kenji!"),
    m(dmId("layla-haddad", "marcus-bennett"), "marcus-bennett", 2 * H, "Can you look at my stroke patient's echo later today?"),
    m(dmId("layla-haddad", "marcus-bennett"), "layla-haddad", 2 * H - 15, "Yes, after 3 pm. Which bed?"),
    m(dmId("layla-haddad", "marcus-bennett"), "marcus-bennett", 80, "Stroke unit 6A, bed 1. Thank you!"),
    m(dmId("layla-haddad", "priya-nair"), "priya-nair", 4 * H, "Northwind needs your note for Maya Robinson's Holter pre-approval."),
    m(dmId("layla-haddad", "priya-nair"), "layla-haddad", 4 * H - 30, "I'll add it before lunch."),
    m(dmId("layla-haddad", "priya-nair"), "priya-nair", 2 * H, "Got it, sent to Northwind. Thanks!"),
    m(dmId("sam-okafor", "grace-lee"), "grace-lee", 30, "Coffee after handover?"),
    m(dmId("sam-okafor", "grace-lee"), "sam-okafor", 28, "Yes! ☕"),
    m(dmId("sam-okafor", "grace-lee"), "grace-lee", 8, "Running 10 min late, sorry."),
    m(dmId("sam-okafor", "elena-varga"), "elena-varga", 6 * H, "Can you cover an extra shift on Saturday?"),
    m(dmId("sam-okafor", "elena-varga"), "sam-okafor", 6 * H - 30, "I can do the day shift."),
    m(dmId("sam-okafor", "elena-varga"), "elena-varga", 3 * H, "Perfect, it's on the roster. Thank you!"),
    m(dmId("kenji-mori", "david-cho"), "david-cho", 40, "Analyzer 2 is back online."),
    m(dmId("kenji-mori", "david-cho"), "kenji-mori", 38, "Great news. Can you run the backlog first?"),
    m(dmId("kenji-mori", "david-cho"), "david-cho", 10, "On it. About 20 samples, done by 15:00."),
    m(dmId("kenji-mori", "sam-okafor"), "sam-okafor", 3 * H, "Lily Tran's inhaler is not on the trolley. Is it coming up?"),
    m(dmId("kenji-mori", "sam-okafor"), "kenji-mori", 3 * H - 10, "Sent with the porter just now."),
    m(dmId("priya-nair", "rachel-adams"), "rachel-adams", 50, "Lunch at 1?"),
    m(dmId("priya-nair", "rachel-adams"), "priya-nair", 45, "Make it 1:30, I'm on a call with Cobalt."),
    m(dmId("priya-nair", "rachel-adams"), "rachel-adams", 12, "Sounds good. I'll book a table by the window."),
    m(dmId("priya-nair", "elena-varga"), "elena-varga", 7 * H, "Can you join the insurer meeting on Thursday?"),
    m(dmId("priya-nair", "elena-varga"), "priya-nair", 7 * H - 30, "Yes, I'll bring the claim numbers."),
    m(dmId("elena-varga", "luis-ortega"), "luis-ortega", 60, "The new beds for 4B arrive on Monday."),
    m(dmId("elena-varga", "luis-ortega"), "luis-ortega", 45, "We need to move the old ones out on Sunday evening."),
  ];
}

/* --------------------------------------------------------------- care chat */

export function seedCareThreads(): CareThread[] {
  const t = (
    id: string,
    patientId: string,
    title: string,
    topic: CareTopic,
    team: CareTeam,
    staffId: string,
    createdMin: number,
    read: { patient: number; staff: number },
    refId?: string,
  ): CareThread => ({
    id,
    patientId,
    title,
    topic,
    team,
    staffId,
    refId,
    createdAt: ago(createdMin),
    seedReadAt: { patient: ago(read.patient), staff: ago(read.staff) },
  });

  return [
    t("ct-bp", DEMO_PATIENT_ID, "Blood pressure follow-up", "appointment", "doctor", "layla-haddad", 6 * D, { patient: 3 * H, staff: 2 * H }, "APT-21140"),
    t("ct-order", DEMO_PATIENT_ID, "Order ORD-52210", "order", "pharmacy", "kenji-mori", 2 * D, { patient: 2 * H, staff: 4 * H }, "ORD-52210"),
    t("ct-insurance", DEMO_PATIENT_ID, "Insurance question", "billing", "billing", "priya-nair", 3 * D, { patient: 1, staff: D }),
    t("ct-rash", DEMO_PATIENT_ID, "Skin rash photo", "appointment", "doctor", "amara-nwosu", 4 * D, { patient: 1, staff: 1 }, "APT-21162"),
    t("ct-refill", DEMO_PATIENT_ID, "Prescription refill: amlodipine", "prescription", "pharmacy", "kenji-mori", 9 * D, { patient: 1, staff: 1 }),
    t("ct-results", DEMO_PATIENT_ID, "Heart screen results", "other", "doctor", "layla-haddad", 18 * D, { patient: 1, staff: 1 }, "ORD-51842"),
    t("ct-whitaker", "james-whitaker", "Questions about going home", "other", "doctor", "layla-haddad", D, { patient: 1, staff: 3 * H }),
    t("ct-chloe", "chloe-martin", "Holter monitor instructions", "appointment", "doctor", "layla-haddad", 2 * D, { patient: 1, staff: 2 * H }),
    t("ct-rosa", "rosa-delgado", "Discharge paperwork", "other", "doctor", "layla-haddad", 5 * H, { patient: 1, staff: 1 }),
    t("ct-george-rx", "george-okoro", "Order ORD-52279", "prescription", "pharmacy", "kenji-mori", D, { patient: 1, staff: 3 * H }, "ORD-52279"),
    t("ct-zara", "zara-ali", "Order ORD-52266", "prescription", "pharmacy", "kenji-mori", D, { patient: 1, staff: 1 }, "ORD-52266"),
    t("ct-lily", "lily-tran", "Inhaler order ORD-52291", "order", "pharmacy", "kenji-mori", 6 * H, { patient: 1, staff: 3 * H }, "ORD-52291"),
    t("ct-george-bill", "george-okoro", "Self-pay discount", "billing", "billing", "priya-nair", 2 * H, { patient: 1, staff: 3 * H }),
    t("ct-olivia", "olivia-grant", "Is the wellness package covered?", "billing", "billing", "priya-nair", D, { patient: 1, staff: 1 }, "ORD-52302"),
    t("ct-whitaker-nurse", "james-whitaker", "Food and visitors on 4B", "other", "nurse", "sam-okafor", 8 * H, { patient: 1, staff: 3 * H }),
    t("ct-rosa-nurse", "rosa-delgado", "Walking before discharge", "other", "nurse", "sam-okafor", D, { patient: 1, staff: 1 }),
  ];
}

export function seedCareMessages(): CareMessage[] {
  let n = 0;
  const c = (threadId: string, authorId: string, minAgo: number, body: string, extra: Partial<CareMessage> = {}): CareMessage => ({
    id: `cm-${++n}`,
    threadId,
    authorId,
    body,
    createdAt: ago(minAgo),
    status: "read",
    ...extra,
  });
  const me = DEMO_PATIENT_ID;

  return [
    c("ct-bp", me, 6 * D, "Hi Dr. Haddad, here are my home blood pressure readings from last week.", { attachments: [{ name: "bp-log-week-1.pdf", size: 96_000, kind: "file" }] }),
    c("ct-bp", "layla-haddad", 6 * D - 3 * H, "Thanks, Maya. Most readings are a bit high in the morning. Keep measuring twice a day for one more week."),
    c("ct-bp", me, 2 * D, "Okay. I sometimes feel a light headache in the morning. Is that normal?"),
    c("ct-bp", "layla-haddad", 2 * D - 2 * H, "It can happen with higher morning readings. If the headache is very bad or sudden, call us right away. We'll talk about it at your visit."),
    c("ct-bp", me, 4 * H, "Here is week 2. The numbers look a bit better.", { attachments: [{ name: "bp-log-week-2.pdf", size: 102_000, kind: "file" }] }),
    c("ct-bp", "layla-haddad", 2 * H, "Yes, much better! Average 128/82. Please bring the log to your visit."),

    c("ct-order", me, 2 * D, "Hi, when will my blood pressure monitor arrive?"),
    c("ct-order", "kenji-mori", 2 * D - 40, "Hi Maya, it ships today. You'll get a delivery window by text."),
    c("ct-order", "system", 3 * H, "Order ORD-52210 was shipped. Delivery today, 14:00–18:00."),
    c("ct-order", "kenji-mori", 2 * H + 30, "Good news: it's on the truck. The pill organizer is in the same box."),

    c("ct-insurance", me, 3 * D, "Does Northwind cover the Holter test?"),
    c("ct-insurance", "priya-nair", 3 * D - 2 * H, "Hi Maya! Northwind covers 80% after a pre-approval. I've asked Dr. Haddad for a short note."),
    c("ct-insurance", "priya-nair", 90, "The pre-approval request is with Northwind now. Answers usually take 2–3 working days."),
    c("ct-insurance", "priya-nair", 45, "Also, your new card photo is uploaded. I'll verify it today."),

    c("ct-rash", me, 4 * D, "Hi doctor, this is the rash on my left arm. It itches at night.", { attachments: [{ name: "rash-left-arm.jpg", size: 1_240_000, kind: "image" }] }),
    c("ct-rash", "amara-nwosu", 4 * D - 5 * H, "Thanks for the photo. It looks like mild eczema. Use a plain moisturizer twice a day and we'll look closer at your video visit."),
    c("ct-rash", me, 3 * D, "Thank you! I'll do that."),

    c("ct-refill", me, 9 * D, "Can I get a refill of amlodipine 5 mg?"),
    c("ct-refill", "kenji-mori", 9 * D - 3 * H, "Dr. Haddad approved it. It's ready for pick-up at the main pharmacy from tomorrow 9:00."),
    c("ct-refill", me, 8 * D, "Picked it up. Thanks!"),

    c("ct-results", "layla-haddad", 18 * D, "Your heart screen is back. Everything is in range except LDL cholesterol, which is a little high."),
    c("ct-results", me, 18 * D - 2 * H, "What should I do about the LDL?"),
    c("ct-results", "layla-haddad", 18 * D - 4 * H, "Start with food: more fiber, less fried food, and 30 minutes of walking most days. We'll recheck in 3 months."),

    c("ct-whitaker", "james-whitaker", D, "Doctor, when can I go home? My wife wants to know."),
    c("ct-whitaker", "layla-haddad", D - 2 * H, "Hi James. If your weight keeps going down and you're off oxygen, maybe in 2–3 days."),
    c("ct-whitaker", "james-whitaker", 2 * H, "Do I need to change my diet at home?", { status: "delivered" }),

    c("ct-chloe", "layla-haddad", 2 * D, "Hi Chloe, your Holter monitor is booked. Please wear a loose top on the day."),
    c("ct-chloe", "chloe-martin", 3 * H, "Can I shower while wearing it?", { status: "delivered" }),
    c("ct-chloe", "chloe-martin", 3 * H - 2, "Also, can I go to the gym?", { status: "delivered" }),

    c("ct-rosa", "rosa-delgado", 5 * H, "Hi, who can help me with the discharge papers for my work?"),
    c("ct-rosa", "layla-haddad", 4 * H, "Hi Rosa, I'll sign a sick note today. The ward clerk will give you a copy."),

    c("ct-george-rx", "kenji-mori", D, "Hi George, the photo of your prescription is hard to read. Could you upload a clearer one?"),
    c("ct-george-rx", "george-okoro", 3 * H + 20, "Sorry about that. Here's a new photo.", { attachments: [{ name: "prescription-new.jpg", size: 860_000, kind: "image" }], status: "delivered" }),

    c("ct-zara", "zara-ali", D, "Is the amoxicillin ready? I also ordered a moisturizer."),
    c("ct-zara", "kenji-mori", D - 3 * H, "We need to check the prescription with your doctor first. I'll update you today."),

    c("ct-lily", "lily-tran", 6 * H, "Hi, I'm Lily's mom. Can the inhaler and the nebulizer come together?"),
    c("ct-lily", "lily-tran", 4 * H, "We go home tomorrow if she is better.", { status: "delivered" }),

    c("ct-george-bill", "george-okoro", 2 * H, "Rachel called about my insurance. What is the self-pay discount?", { status: "delivered" }),

    c("ct-olivia", "olivia-grant", D, "Is the Women's Wellness package covered by Harborline?"),
    c("ct-olivia", "priya-nair", D - H, "Yes! Harborline covers 60%. You'll pay about $92 on the day."),
    c("ct-olivia", "olivia-grant", D - 2 * H, "Great, thank you so much."),

    // Ward nurse threads (kept at the end so older message ids stay the same).
    c("ct-whitaker-nurse", "james-whitaker", 8 * H, "Hi, can my wife bring soup from home tonight?"),
    c("ct-whitaker-nurse", "sam-okafor", 7 * H + 30, "Hi James, yes, but low salt please, it's better for your heart. Ask her to show it at the nurses' desk."),
    c("ct-whitaker-nurse", "james-whitaker", 2 * H + 10, "Thanks. Can she stay after 8 pm too?", { status: "delivered" }),

    c("ct-rosa-nurse", "rosa-delgado", D, "Can I walk to the café on my own today?"),
    c("ct-rosa-nurse", "sam-okafor", D - 40, "Short walks on the ward are great. Please take a nurse with you off the ward until Dr. Haddad says it's OK."),
    c("ct-rosa-nurse", "rosa-delgado", D - 55, "Okay, thank you Sam!"),
  ];
}

/* --------------------------------------------------------------- community */

export const communityTopicIcons = [
  "heart-health",
  "diabetes",
  "mental-health",
  "new-parents",
  "caregivers",
  "nutrition",
  "fitness-recovery",
  "medicines",
  "general",
] as const;

export function seedTopics(): CommunityTopic[] {
  const t = (id: string, name: string, description: string, members: number, extra: Partial<CommunityTopic> = {}): CommunityTopic => ({
    id,
    name,
    description,
    icon: communityIcon(id),
    createdBy: "Community team",
    createdAt: ago(120 * D),
    members,
    ...extra,
  });
  return [
    t("general", "General", "Say hello, ask about the hospital, share good news.", 1840, { pinned: true }),
    t("heart-health", "Heart health", "Blood pressure, cholesterol and life after a heart event.", 962),
    t("diabetes", "Diabetes", "Day-to-day life with type 1 and type 2 diabetes.", 731),
    t("mental-health", "Mental health", "A kind space to talk about stress, mood and sleep.", 1205),
    t("new-parents", "New parents", "Sleepless nights, feeding and first months together.", 588),
    t("caregivers", "Caregivers", "Support for people caring for a loved one.", 412),
    t("nutrition", "Nutrition", "Healthy eating, recipes and simple swaps.", 877),
    t("fitness-recovery", "Fitness & recovery", "Getting moving again after illness or surgery.", 649),
    t("medicines", "Medicines", "General questions about taking medicines safely.", 503),
    t("knee-club", "Knee replacement club", "Tips and cheering for anyone before or after knee surgery.", 74, {
      icon: communityIcon("custom"),
      custom: true,
      createdBy: "KneeDeepInRehab",
      createdAt: ago(20 * D),
    }),
  ];
}

const patientAuthor = (id: string, name: string, avatar: number): CommunityAuthor => ({ kind: "patient", id, name, avatar: nickAvatar(avatar) });
const staffAuthor = (id: string, name: string, title: string, avatar?: string): CommunityAuthor => ({ kind: "staff", id, name, title, avatar });

const P = {
  maya: patientAuthor(DEMO_PATIENT_ID, "CalmHeart", 2),
  sunny: patientAuthor("member-sunny", "SunnyWalker", 1),
  heron: patientAuthor("member-heron", "BlueHeron", 3),
  tea: patientAuthor("member-tea", "TeaAndToast", 4),
  oak: patientAuthor("member-oak", "QuietOak", 5),
  runner: patientAuthor("member-runner", "MorningRunner", 6),
  george: patientAuthor("george-okoro", "GeoTheBuilder", 1),
  chloe: patientAuthor("chloe-martin", "ChloeSkips", 3),
  olivia: patientAuthor("olivia-grant", "SleepyMamaO", 6),
  victor: patientAuthor("victor-hale", "KneeDeepInRehab", 5),
  zara: patientAuthor("zara-ali", "ZedSkin", 4),
};
const S = {
  layla: staffAuthor("layla-haddad", "Dr. Layla Haddad", "Cardiologist", "/images/doctors/dr-01.png"),
  sam: staffAuthor("sam-okafor", "Sam Okafor", "Charge Nurse", "/images/dashboard/avatar-03.png"),
  kenji: staffAuthor("kenji-mori", "Kenji Mori", "Clinical Pharmacist", "/images/dashboard/avatar-05.png"),
  ananya: staffAuthor("ananya-rao", "Dr. Ananya Rao", "Psychiatrist", "/images/doctors/dr-11.png"),
  yasmine: staffAuthor("yasmine-benali", "Dr. Yasmine Benali", "Obstetrician", "/images/doctors/dr-09.png"),
  maria: staffAuthor("maria-santos", "Maria Santos, RD", "Clinical Dietitian"),
  lena: staffAuthor("lena-schmidt", "Lena Schmidt, DPT", "Lead Physiotherapist"),
  ethan: staffAuthor("ethan-brooks", "Dr. Ethan Brooks", "Endocrinologist"),
  elena: staffAuthor("elena-varga", "Elena Varga", "Hospital Administrator", "/images/dashboard/avatar-04.png"),
};

export function seedPosts(): CommunityPost[] {
  let n = 0;
  let r = 0;
  const reply = (author: CommunityAuthor, minAgo: number, body: string): CommunityReply => ({ id: `cr-${++r}`, author, body, createdAt: ago(minAgo) });
  const p = (topicId: string, author: CommunityAuthor, minAgo: number, body: string, likes = 0, replies: CommunityReply[] = [], extra: Partial<CommunityPost> = {}): CommunityPost => ({
    id: `cp-${++n}`,
    topicId,
    author,
    body,
    createdAt: ago(minAgo),
    likes,
    likedBy: [],
    replies,
    reports: [],
    ...extra,
  });

  return [
    // general
    p("general", S.elena, 30 * D, "Welcome to the community! Be kind, stay curious, and please keep personal medical details out of public posts.", 214),
    p("general", P.sunny, 5 * D, "Shout-out to the night nurses on ward 3C. You made a scary week feel safe. Thank you.", 88, [reply(S.sam, 5 * D - 2 * H, "This made our whole team smile. Thank you for sharing!")]),
    p("general", P.tea, 2 * D, "Does anyone know if the hospital café is open on Sundays?", 6, [reply(P.heron, 2 * D - H, "Yes, 8:00 to 16:00. The soup is great."), reply(P.tea, 2 * D - 2 * H, "Perfect, thanks!")]),
    p("general", P.runner, 20 * H, "Tip: the free shuttle from the train station runs every 15 minutes in the morning.", 23),
    p("general", P.oak, 3 * H, "First time using the app to book. It took 2 minutes. Nice!", 11),

    // heart-health
    p("heart-health", P.heron, 9 * D, "Six months after my stent today. Walking 5 km a day now. Don't give up, it gets better.", 156, [
      reply(S.layla, 9 * D - 3 * H, "Wonderful milestone. Keep it up!"),
      reply(P.sunny, 9 * D - 5 * H, "So inspiring. I'm at month two."),
    ]),
    p("heart-health", P.maya, 3 * D, "My home blood pressure is always higher in the morning. Is that common? It makes me a bit nervous.", 19, [
      reply(P.runner, 3 * D - H, "Same for me! My doctor said mornings are often higher."),
      reply(S.sam, 3 * D - 2 * H, "Quite common. Measure at the same time each day and share the log with your care team."),
    ]),
    p("heart-health", P.sunny, 2 * D, "What's your favorite low-salt snack? I'm bored of rice cakes.", 34, [
      reply(P.tea, 2 * D - H, "Unsalted nuts and an apple."),
      reply(P.oak, 2 * D - 2 * H, "Air-popped popcorn with paprika!"),
      reply(S.maria, 2 * D - 3 * H, "Both great picks. Hummus with carrots works too."),
    ]),
    p("heart-health", P.george, D, "I've been on atorvastatin 20 mg for a week. My MRN is AUR-205521, and my legs ache since I started. Should I stop?", 2, [], {
      movedTo: { threadId: "ct-george-rx", by: "Kenji Mori", at: ago(D - 30) },
    }),
    p("heart-health", P.runner, 10 * H, "Got my cardiac rehab plan today. Three sessions a week. Any tips for the first one?", 15, [reply(P.heron, 9 * H, "Wear comfy shoes and tell them how you feel. They're lovely.")]),
    p("heart-health", S.layla, 5 * H, "Reminder: free blood pressure checks in the main lobby every Friday, 10:00–14:00. No booking needed.", 47),

    // diabetes
    p("diabetes", P.tea, 12 * D, "Ten years with type 2 today. My HbA1c is the best it's ever been. Small steps work!", 120, [reply(S.ethan, 12 * D - 4 * H, "Congratulations, that's real work.")]),
    p("diabetes", P.oak, 4 * D, "How do you handle sweets at family parties?", 28, [
      reply(P.tea, 4 * D - H, "I eat a proper meal first, then have a small piece of cake."),
      reply(P.sunny, 4 * D - 2 * H, "I bring a dessert I know is OK for me."),
    ]),
    p("diabetes", P.heron, 30 * H, "Which glucose meter app do people like? Mine keeps losing data.", 9),
    p("diabetes", S.ethan, 6 * H, "Our next diabetes education class is on Tuesday at 17:00 (online). It's free for patients and families.", 31),

    // mental-health
    p("mental-health", P.oak, 7 * D, "Is it normal to feel low after a long hospital stay? I'm home now but I feel flat.", 64, [
      reply(S.ananya, 7 * D - 3 * H, "Yes, it's very common. Be gentle with yourself. If it lasts more than two weeks, please talk to your doctor."),
      reply(P.heron, 7 * D - 5 * H, "I felt the same. Short walks helped me a lot."),
    ]),
    p("mental-health", P.chloe, 3 * D, "Breathing trick that helps me when my heart races: in for 4, hold for 4, out for 6.", 51),
    p("mental-health", P.sunny, 26 * H, "Anyone tried journaling for sleep? Does it work for you?", 17, [reply(P.tea, 25 * H, "Writing a to-do list before bed helps my busy brain.")]),
    p("mental-health", S.ananya, 8 * H, "If you ever feel unsafe, call the emergency number right away. You don't have to wait.", 88),

    // new-parents
    p("new-parents", P.olivia, 2 * D, "Day 2 home with our baby girl. How do you all get any sleep?", 73, [
      reply(P.runner, 2 * D - H, "Sleep when she sleeps. Ignore the dishes!"),
      reply(S.yasmine, 2 * D - 3 * H, "Congratulations! Share night feeds with your partner if you can, and ask for help."),
      reply(P.tea, 2 * D - 4 * H, "It gets easier around week 6, promise."),
    ]),
    p("new-parents", P.heron, 5 * D, "Which baby carrier was easiest for you?", 12),
    p("new-parents", P.olivia, 7 * H, "Our first walk outside today. 15 minutes in the park felt amazing.", 44),

    // caregivers
    p("caregivers", P.sunny, 6 * D, "Caring for my dad after his stroke. Some days I feel like I'm doing it all wrong.", 82, [
      reply(P.oak, 6 * D - 2 * H, "You're doing your best, and that's enough. Take breaks."),
      reply(S.sam, 6 * D - 4 * H, "Our social work team can help with respite care. Ask at the ward desk."),
    ]),
    p("caregivers", P.tea, 3 * D, "Pill organizers with alarms changed our life. No more missed doses for my mum.", 29),
    p("caregivers", P.heron, 14 * H, "Is anyone else juggling work and caring? How do you manage?", 21),

    // nutrition
    p("nutrition", S.maria, 10 * D, "Easy swap of the week: use herbs, lemon and garlic instead of salt.", 140),
    p("nutrition", P.runner, 4 * D, "Overnight oats recipe: oats, milk, chia, berries. Ready in the morning.", 66, [reply(P.sunny, 4 * D - H, "Making this tonight!")]),
    p("nutrition", P.tea, 2 * D, "Is frozen veg as good as fresh?", 18, [reply(S.maria, 2 * D - 2 * H, "Yes! Frozen veg keeps its vitamins well and is often cheaper.")]),
    p("nutrition", P.zara, 30 * H, "Does food affect eczema? Mine got worse this month.", 7),
    p("nutrition", P.oak, 6 * H, "Spam link removed: buy miracle pills here!!!", 0, [], { hidden: true, reports: [{ reason: "Spam or advertising", by: "member-heron", at: ago(5 * H) }] }),

    // fitness-recovery
    p("fitness-recovery", S.lena, 8 * D, "Start slow: 5 minutes of walking, three times a day. Add 1 minute each day.", 92),
    p("fitness-recovery", P.victor, 3 * D, "Day 2 after knee surgery. Stood up with the physio today!", 77, [reply(S.lena, 3 * D - 3 * H, "Great work, Victor! See you tomorrow at 10.")]),
    p("fitness-recovery", P.runner, 20 * H, "Back to jogging 3 months after my heart attack. Slow and steady.", 58),
    p("fitness-recovery", P.heron, 4 * H, "Best stretching videos for stiff backs? Desk job problems.", 4),

    // medicines
    p("medicines", S.kenji, 15 * D, "Tip: keep an up-to-date list of all your medicines in your phone. Show it at every visit.", 104),
    p("medicines", P.oak, 2 * D, "Can I take my blood pressure pill at night instead of the morning?", 13, [reply(S.kenji, 2 * D - H, "Often yes, but ask your own doctor or pharmacist first. It depends on the medicine.")]),
    p("medicines", P.tea, 22 * H, "Where do you get rid of old medicines? The bin feels wrong.", 20, [reply(S.kenji, 21 * H, "Bring them to any hospital pharmacy. We dispose of them safely.")]),
    p("medicines", P.sunny, 3 * H, "This pharmacist is useless and rude, avoid him.", 0, [], { reports: [{ reason: "Harassment or abuse", by: "member-tea", at: ago(2 * H) }] }),

    // knee-club
    p("knee-club", P.victor, 20 * D, "Started this group for anyone before or after knee surgery. Share tips and wins!", 31, [reply(P.runner, 19 * D, "Joined! Surgery in 3 weeks.")]),
    p("knee-club", P.runner, 10 * D, "What should I pack for the hospital?", 12, [
      reply(P.victor, 10 * D - H, "Loose shorts, slip-on shoes and a long phone charger."),
      reply(P.oak, 10 * D - 3 * H, "And earplugs!"),
    ]),
    p("knee-club", P.victor, 2 * D, "Ice packs: 20 minutes on, 20 off. Life saver.", 19),
  ];
}
