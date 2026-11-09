import type { AiReply, TriageMode, TriageResponse } from "./types";

/**
 * Turns an AI reply into what the patient sees. Urgency is checked first, so the
 * AI cannot ask another question or name a department once it has rated a
 * message as an emergency.
 */
export function decide(ai: AiReply, mode: TriageMode): TriageResponse {
  if (ai.urgency === "emergency" || ai.urgency === "crisis") {
    return { kind: "emergency", type: ai.urgency, mode };
  }

  if (ai.status === "done") {
    if (!ai.department || !ai.reason?.trim() || !ai.summary?.trim()) {
      return { kind: "unavailable", reason: "error", mode };
    }
    return {
      kind: "result",
      department: ai.department,
      urgency: ai.urgency,
      reason: ai.reason.trim(),
      summary: ai.summary.trim(),
      mode,
    };
  }

  const message = ai.message.trim();
  if (!message) return { kind: "unavailable", reason: "error", mode };
  return { kind: ai.status === "confirming" ? "confirm" : "question", message, mode };
}
