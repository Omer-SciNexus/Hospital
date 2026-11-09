"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { FlaskConical, Phone, RotateCcw, SendHorizontal, Siren } from "lucide-react";
import { site } from "@/config/site";
import { TRIAGE_MAX_MESSAGE_LENGTH, TRIAGE_OPENING_QUESTION } from "@/config/triage";
import { cn } from "@/lib/utils";
import { useTriage } from "@/store/triage";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { TriageEmergency } from "./triage-emergency";
import { TriageResult } from "./triage-result";

function Bubble({ from, children }: { from: "bot" | "patient"; children: React.ReactNode }) {
  return (
    <li className={cn("flex animate-[fade-in_200ms_ease-out]", from === "patient" && "justify-end")}>
      <p
        className={cn(
          "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm",
          from === "bot" ? "rounded-bl-md bg-muted" : "rounded-br-md bg-primary text-primary-foreground",
        )}
      >
        <span className="sr-only">{from === "bot" ? "Assistant: " : "You: "}</span>
        {children}
      </p>
    </li>
  );
}

function Unavailable({ reason }: { reason: "error" | "busy" | "limit" }) {
  const retry = useTriage((s) => s.retry);
  const reset = useTriage((s) => s.reset);
  const setOpen = useTriage((s) => s.setOpen);
  const text = {
    error: "I can't answer right now.",
    busy: "Too many messages were sent. Please wait a few minutes.",
    limit: "I need a person to help with this.",
  }[reason];

  return (
    <div role="status" className="space-y-3 rounded-2xl border border-border p-4">
      <p className="font-semibold">{text}</p>
      <p className="text-sm text-muted-foreground">Our team can find the right department for you by phone.</p>
      <div className="flex flex-col gap-2">
        <Button asChild>
          <a href={`tel:${site.phone}`}>
            <Phone aria-hidden /> Call {site.phone}
          </a>
        </Button>
        <Button asChild variant="outline">
          <Link href="/departments" onClick={() => setOpen(false)}>
            See all departments
          </Link>
        </Button>
        {reason === "limit" ? (
          <Button variant="ghost" onClick={reset}>
            <RotateCcw aria-hidden /> Start over
          </Button>
        ) : (
          <Button variant="ghost" onClick={retry}>
            <RotateCcw aria-hidden /> Try again
          </Button>
        )}
      </div>
    </div>
  );
}

function Conversation() {
  const messages = useTriage((s) => s.messages);
  const pending = useTriage((s) => s.pending);
  const outcome = useTriage((s) => s.outcome);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, pending, outcome]);

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <ul role="log" aria-label="Conversation" aria-live="polite" className="space-y-3">
        <Bubble from="bot">{TRIAGE_OPENING_QUESTION}</Bubble>
        {messages.map((m, i) => (
          <Bubble key={i} from={m.role === "user" ? "patient" : "bot"}>
            {m.content}
          </Bubble>
        ))}
        {pending && (
          <li className="flex">
            <span className="rounded-2xl rounded-bl-md bg-muted px-4 py-2.5 text-sm text-muted-foreground">Reading your answer…</span>
          </li>
        )}
      </ul>
      {outcome?.kind === "unavailable" && (
        <div className="mt-4">
          <Unavailable reason={outcome.reason} />
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}

function ChatInput({ inputRef }: { inputRef: React.RefObject<HTMLTextAreaElement | null> }) {
  const draft = useTriage((s) => s.draft);
  const setDraft = useTriage((s) => s.setDraft);
  const send = useTriage((s) => s.send);
  const pending = useTriage((s) => s.pending);
  const awaitingConfirm = useTriage((s) => s.awaitingConfirm);
  const started = useTriage((s) => s.messages.length > 0);

  return (
    <div className="border-t border-border p-4">
      {awaitingConfirm && !pending && (
        <div className="mb-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => send("Yes, that is correct")}>Yes, correct</Button>
          <Button size="sm" variant="outline" onClick={() => send("No, I want to change something")}>No, change something</Button>
        </div>
      )}
      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
      >
        <label htmlFor="triage-input" className="sr-only">Your answer</label>
        <textarea
          id="triage-input"
          ref={inputRef}
          rows={1}
          value={draft}
          maxLength={TRIAGE_MAX_MESSAGE_LENGTH}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send(draft);
            }
          }}
          placeholder={started ? "Type your answer" : "For example: my lower back hurts"}
          className="field-sizing-content max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-border bg-surface px-4 py-2.5 text-base outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 sm:text-sm"
        />
        <Button type="submit" size="icon" className="size-11" disabled={pending || !draft.trim()} aria-label="Send">
          <SendHorizontal aria-hidden />
        </Button>
      </form>
      <p className="mt-2 text-xs text-muted-foreground">
        Please don&apos;t type your name or other personal details. Your words may be sent to an AI service so it can answer you. This chat is not saved.
      </p>
    </div>
  );
}

export function TriagePanel() {
  const open = useTriage((s) => s.open);
  const setOpen = useTriage((s) => s.setOpen);
  const outcome = useTriage((s) => s.outcome);
  const mode = useTriage((s) => s.mode);
  const pending = useTriage((s) => s.pending);
  const messageCount = useTriage((s) => s.messages.length);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Back to the text box after each reply, or after "I typed this by mistake".
  useEffect(() => {
    if (open && !pending && !outcome) inputRef.current?.focus();
  }, [open, pending, outcome, messageCount]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="w-full max-w-md sm:w-[440px]"
        onOpenAutoFocus={(e) => {
          if (!outcome) {
            e.preventDefault();
            inputRef.current?.focus();
          }
        }}
      >
        <div className="border-b border-border px-5 pb-4 pt-5">
          <SheetTitle className="pr-10 font-display text-xl font-extrabold">Find my department</SheetTitle>
          <SheetDescription className="mt-1 pr-10 text-sm text-muted-foreground">
            This is not medical advice. Your doctor makes the diagnosis.
          </SheetDescription>
          {mode === "test" && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-950 dark:bg-amber-950 dark:text-amber-100">
              <FlaskConical className="size-3.5" aria-hidden /> Test mode: example replies, not AI
            </p>
          )}
        </div>

        <a
          href={`tel:${site.emergencyShort}`}
          className="flex items-center justify-center gap-2 bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
        >
          <Siren className="size-4" aria-hidden /> Emergency? Call {site.emergencyShort}
        </a>

        {outcome?.kind === "emergency" ? (
          <TriageEmergency type={outcome.type} />
        ) : outcome?.kind === "result" ? (
          <TriageResult result={outcome} />
        ) : (
          <>
            <Conversation />
            {!outcome && <ChatInput inputRef={inputRef} />}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
