import { z } from "zod";
import { TRIAGE_DEPARTMENTS, TRIAGE_MAX_MESSAGE_LENGTH, TRIAGE_MAX_PATIENT_TURNS } from "@/config/triage";

const chatMessageSchema = z.discriminatedUnion("role", [
  z.object({ role: z.literal("user"), content: z.string().trim().min(1).max(TRIAGE_MAX_MESSAGE_LENGTH) }),
  z.object({ role: z.literal("assistant"), content: z.string().trim().min(1).max(4000) }),
]);

export type ChatMessage = z.infer<typeof chatMessageSchema>;

/** The conversation must alternate, starting and ending with the patient. */
export const triageRequestSchema = z.object({
  messages: z
    .array(chatMessageSchema)
    .min(1)
    .max(TRIAGE_MAX_PATIENT_TURNS * 2 + 3)
    .refine((list) => list.every((m, i) => m.role === (i % 2 === 0 ? "user" : "assistant")), "Messages must alternate")
    .refine((list) => list.at(-1)?.role === "user", "The last message must be from the patient"),
});

/** What the AI (or test mode) returns on every turn. No code path trusts it without `decide`. */
export const aiReplySchema = z.object({
  status: z.enum(["asking", "confirming", "done"]),
  urgency: z.enum(["routine", "urgent", "emergency", "crisis"]),
  message: z.string(),
  department: z.enum(TRIAGE_DEPARTMENTS).nullable(),
  reason: z.string().nullable(),
  summary: z.string().nullable(),
});

export type AiReply = z.infer<typeof aiReplySchema>;

const mode = z.enum(["test", "live"]).optional();

/** What the browser receives. */
export const triageResponseSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("question"), message: z.string(), mode }),
  z.object({ kind: z.literal("confirm"), message: z.string(), mode }),
  z.object({
    kind: z.literal("result"),
    department: z.enum(TRIAGE_DEPARTMENTS),
    urgency: z.enum(["routine", "urgent"]),
    reason: z.string(),
    summary: z.string(),
    mode,
  }),
  z.object({ kind: z.literal("emergency"), type: z.enum(["emergency", "crisis"]), mode }),
  z.object({ kind: z.literal("unavailable"), reason: z.enum(["error", "busy", "limit"]), mode }),
]);

export type TriageResponse = z.infer<typeof triageResponseSchema>;
export type TriageMode = NonNullable<TriageResponse["mode"]>;
