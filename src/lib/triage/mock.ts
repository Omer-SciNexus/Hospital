import type { TriageDepartment } from "@/config/triage";
import type { AiReply, ChatMessage } from "./types";

/**
 * Test mode: fixed replies, so the whole chat can be used without an AI key.
 * It is a simple script for trying the screens. It does not understand the
 * patient and must never be shown as medical guidance.
 */

interface Area {
  words: RegExp;
  label: string;
  department: TriageDepartment;
  danger: string;
}

const AREAS: Area[] = [
  { words: /tooth|teeth|gum|molar/i, label: "teeth", department: "dentistry", danger: "Is your face swollen, and do you have a fever?" },
  { words: /\beyes?\b|vision|blurry/i, label: "eyes", department: "ophthalmology", danger: "Did you suddenly lose vision, or get a chemical in your eye?" },
  { words: /\bears?\b|\bnose\b|throat|sinus/i, label: "ear, nose or throat", department: "ent", danger: "Are you unable to swallow your own saliva?" },
  { words: /skin|rash|itch|acne|\bhair\b|\bmole\b/i, label: "skin", department: "dermatology", danger: "Are your lips or face swelling?" },
  { words: /pregnan|period|vagin|breast/i, label: "women's health", department: "obstetrics-gynecology", danger: "Do you have heavy bleeding or severe pain right now?" },
  { words: /urine|\bpee\b|bladder|prostate|kidney/i, label: "urinary system", department: "urology", danger: "Are you completely unable to pass urine?" },
  { words: /stomach|belly|abdomen|nausea|diarrh|constipat|heartburn/i, label: "stomach", department: "gastroenterology", danger: "Are you vomiting blood, or is the pain sudden and severe?" },
  { words: /heart|palpitation|blood pressure/i, label: "heart", department: "cardiology", danger: "Do you feel faint or have pain right now?" },
  { words: /cough|breath|asthma|wheez|lung/i, label: "breathing", department: "pulmonology", danger: "Are your lips turning blue, or are you coughing blood?" },
  { words: /head|migraine|dizz|numb|memory/i, label: "head or nerves", department: "neurology", danger: "Is this the worst headache of your life, or do you have new weakness?" },
  { words: /back|knee|joint|bone|shoulder|\bhip\b|ankle|neck|wrist|\bleg\b|\barm\b/i, label: "bones or joints", department: "orthopedics", danger: "Are you unable to move the limb, or have you lost bladder control?" },
  { words: /diabet|thyroid|\bweight\b/i, label: "hormones or weight", department: "endocrinology", danger: "Are you very confused or very sleepy?" },
  { words: /anxi|depress|stress|\bsad\b|sleep|insomnia/i, label: "mood or sleep", department: "psychiatry", danger: "Are you having any thoughts of harming yourself?" },
];

const GENERAL: Area = {
  words: /$^/,
  label: "general health",
  department: "internal-medicine",
  danger: "Do you have a very high fever with confusion?",
};

export const MOCK_CONFIRM_PREFIX = "So, here is what I understood: ";
const CONFIRM_SUFFIX = " Is this correct?";
const ASK_CORRECTION = "No problem. What should I change?";
const YES = /^\s*(?:yes|yeah|yep|y|correct|right)\b/i;

function reply(status: AiReply["status"], message: string): AiReply {
  return { status, urgency: "routine", message, department: null, reason: null, summary: null };
}

function findArea(patient: string[]) {
  for (const text of [...patient].reverse()) {
    const area = AREAS.find((a) => a.words.test(text));
    if (area) return area;
  }
  return GENERAL;
}

function confirmReply(symptom: string, started: string, level: string) {
  return reply("confirming", `${MOCK_CONFIRM_PREFIX}"${symptom}". It started: ${started}. Level from 1 to 10: ${level}.${CONFIRM_SUFFIX}`);
}

export function mockReply(messages: ChatMessage[]): AiReply {
  const patient = messages.filter((m) => m.role === "user").map((m) => m.content);
  const asked = messages.filter((m) => m.role === "assistant").map((m) => m.content);
  const last = patient[patient.length - 1];
  const lastAsked = asked[asked.length - 1];
  const area = findArea(patient);

  if (lastAsked === ASK_CORRECTION) return confirmReply(last, patient[1], patient[2]);

  if (lastAsked?.startsWith(MOCK_CONFIRM_PREFIX)) {
    if (!YES.test(last)) return reply("asking", ASK_CORRECTION);
    const level = Number(/\d+/.exec(patient[2])?.[0] ?? 0);
    return {
      status: "done",
      urgency: level >= 8 ? "urgent" : "routine",
      message: "",
      department: area.department,
      reason: `Test mode matched your words to ${area.label}.`,
      summary: lastAsked.slice(MOCK_CONFIRM_PREFIX.length).replace(CONFIRM_SUFFIX, ""),
    };
  }

  switch (asked.length) {
    case 0:
      return reply("asking", `Thank you. This sounds related to your ${area.label}. When did it start?`);
    case 1:
      return reply("asking", "From 1 to 10, how bad is it right now?");
    case 2:
      return reply("asking", area.danger);
    default:
      if (YES.test(last)) return { ...reply("asking", ""), urgency: "emergency" };
      return confirmReply(patient[0], patient[1], patient[2]);
  }
}
