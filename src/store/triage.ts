import { create } from "zustand";
import { findRedFlag } from "@/lib/triage/red-flags";
import { triageResponseSchema, type ChatMessage, type TriageMode, type TriageResponse } from "@/lib/triage/types";

type Outcome = Extract<TriageResponse, { kind: "result" | "emergency" | "unavailable" }>;

interface TriageState {
  open: boolean;
  draft: string;
  messages: ChatMessage[];
  pending: boolean;
  awaitingConfirm: boolean;
  outcome: Outcome | null;
  mode: TriageMode | null;
  setOpen: (open: boolean) => void;
  setDraft: (draft: string) => void;
  send: (text: string) => void;
  retry: () => void;
  undoLastMessage: () => void;
  reset: () => void;
}

const REQUEST_TIMEOUT_MS = 60_000;

const emptyChat = {
  draft: "",
  messages: [] as ChatMessage[],
  pending: false,
  awaitingConfirm: false,
  outcome: null as Outcome | null,
};

/** A reply is ignored if the chat was reset or changed while it was on its way. */
let latestRequest = 0;

async function requestReply(messages: ChatMessage[]): Promise<TriageResponse> {
  try {
    const response = await fetch("/api/triage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const parsed = triageResponseSchema.safeParse(await response.json());
    if (parsed.success) return parsed.data;
  } catch {
    // Offline, timed out or not JSON: the patient gets the phone number below.
  }
  return { kind: "unavailable", reason: "error" };
}

/**
 * This store is deliberately not persisted. Health answers stay in memory and
 * are gone after a refresh.
 */
export const useTriage = create<TriageState>()((set, get) => {
  async function ask() {
    const request = ++latestRequest;
    set({ pending: true, awaitingConfirm: false, outcome: null });
    const reply = await requestReply(get().messages);
    if (request !== latestRequest) return;

    set({ pending: false, ...(reply.mode ? { mode: reply.mode } : {}) });
    if (reply.kind === "question" || reply.kind === "confirm") {
      set((s) => ({
        messages: [...s.messages, { role: "assistant", content: reply.message }],
        awaitingConfirm: reply.kind === "confirm",
      }));
    } else {
      set({ outcome: reply });
    }
  }

  return {
    ...emptyChat,
    open: false,
    mode: null,
    setOpen: (open) => set({ open }),
    setDraft: (draft) => set({ draft }),

    send: (text) => {
      const content = text.trim();
      if (!content || get().pending || get().outcome) return;
      set((s) => ({ draft: "", messages: [...s.messages, { role: "user", content }] }));

      // No waiting for the network, and these words never leave the browser.
      const flag = findRedFlag(content);
      if (flag) {
        set({ awaitingConfirm: false, outcome: { kind: "emergency", type: flag } });
        return;
      }
      void ask();
    },

    retry: () => {
      const { messages, pending } = get();
      if (!pending && messages[messages.length - 1]?.role === "user") void ask();
    },

    /** "I typed this by mistake": takes the message back so it can be written again. */
    undoLastMessage: () => {
      const { messages } = get();
      const last = messages[messages.length - 1];
      if (last?.role !== "user") return;
      set({ messages: messages.slice(0, -1), draft: last.content, outcome: null });
    },

    reset: () => {
      latestRequest += 1;
      set(emptyChat);
    },
  };
});
