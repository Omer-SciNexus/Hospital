import { NextResponse } from "next/server";
import { TRIAGE_MAX_PATIENT_TURNS } from "@/config/triage";
import { decide } from "@/lib/triage/decide";
import { mockReply } from "@/lib/triage/mock";
import { takeLiveSlot, takeVisitorSlot } from "@/lib/triage/rate-limit";
import { findRedFlag } from "@/lib/triage/red-flags";
import { triageRequestSchema, type ChatMessage, type TriageMode, type TriageResponse } from "@/lib/triage/types";

export const runtime = "nodejs";

/** Live only with a key, and TRIAGE_MODE=test can force test mode even with one. */
function currentMode(): TriageMode {
  return process.env.ANTHROPIC_API_KEY && process.env.TRIAGE_MODE !== "test" ? "live" : "test";
}

function send(body: TriageResponse, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function askAi(messages: ChatMessage[], mode: TriageMode) {
  if (mode === "test") return mockReply(messages);
  // Loaded only in live mode, so test mode never touches the AI code.
  const { askClaude } = await import("@/lib/triage/claude");
  return askClaude(messages);
}

export async function POST(request: Request) {
  const mode = currentMode();

  const parsed = triageRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { messages } = parsed.data;

  // The safety check comes before every limit: an emergency is never told "busy".
  for (const message of messages) {
    if (message.role !== "user") continue;
    const flag = findRedFlag(message.content);
    if (flag) return send({ kind: "emergency", type: flag, mode });
  }

  const visitor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!takeVisitorSlot(visitor)) return send({ kind: "unavailable", reason: "busy", mode }, 429);

  const patientTurns = messages.filter((m) => m.role === "user").length;
  if (patientTurns > TRIAGE_MAX_PATIENT_TURNS) return send({ kind: "unavailable", reason: "limit", mode });

  if (mode === "live" && !takeLiveSlot()) return send({ kind: "unavailable", reason: "busy", mode }, 429);

  try {
    return send(decide(await askAi(messages, mode), mode));
  } catch (error) {
    // Log the error type only. Patient words must never reach the logs.
    console.error("Triage AI failed:", error instanceof Error ? error.name : "unknown");
    return send({ kind: "unavailable", reason: "error", mode }, 503);
  }
}
