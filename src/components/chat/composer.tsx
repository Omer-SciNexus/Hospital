"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Popover } from "radix-ui";
import { Paperclip, SendHorizontal, Smile } from "lucide-react";
import type { ChatAttachment } from "@/data/chat";
import { patients, type Patient } from "@/data/patients";
import { cn } from "@/lib/utils";
import { AttachmentList, ChatAvatar } from "./shared";

export const QUICK_EMOJIS = ["👍", "❤️", "😊", "🙏", "🎉", "✅", "👀", "😂", "😮", "😢", "💪", "☕", "🩺", "💊", "🚑", "👏"];

/** Small emoji grid in a popover. No library. */
export function EmojiPicker({
  onPick,
  label = "Add emoji",
  emojis = QUICK_EMOJIS,
  trigger,
}: {
  onPick: (emoji: string) => void;
  label?: string;
  emojis?: string[];
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        {trigger ?? (
          <button type="button" className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={label}>
            <Smile className="size-[18px]" aria-hidden />
          </button>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="start"
          sideOffset={6}
          className="z-50 grid animate-[menu-in_150ms_ease-out] grid-cols-8 gap-0.5 rounded-2xl border border-border bg-surface p-1.5 shadow-lift outline-none"
        >
          {emojis.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => {
                onPick(e);
                setOpen(false);
              }}
              className="grid size-9 place-items-center rounded-lg text-lg hover:bg-muted focus-visible:bg-muted"
              aria-label={`Emoji ${e}`}
            >
              {e}
            </button>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/**
 * Chat composer: multiline (Enter sends, Shift+Enter new line), attachments,
 * emoji, optional quick replies and an "@" patient mention picker.
 * Mentions are sent as `@[patient:<id>]` tokens.
 * `onSend` may return `false` (or a promise of `false`) when nothing was sent;
 * the text is then kept so the user does not lose it.
 */
export function Composer({
  onSend,
  label,
  placeholder,
  quickReplies,
  mentionPatients,
  tools,
  disabled,
  tone = "default",
  inputRef,
  noAttach,
}: {
  onSend: (text: string, attachments: ChatAttachment[]) => void | boolean | Promise<boolean>;
  label: string;
  placeholder?: string;
  quickReplies?: string[];
  mentionPatients?: boolean;
  tools?: React.ReactNode;
  disabled?: boolean;
  tone?: "default" | "urgent";
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  noAttach?: boolean;
}) {
  const id = useId();
  const ownRef = useRef<HTMLTextAreaElement>(null);
  const ref = inputRef ?? ownRef;
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<ChatAttachment[]>([]);
  const [mentioned, setMentioned] = useState<Patient[]>([]);
  const [mention, setMention] = useState<{ query: string; start: number } | null>(null);
  const [active, setActive] = useState(0);

  const matches = useMemo(() => {
    if (!mention) return [];
    const q = mention.query.toLowerCase();
    return patients.filter((p) => p.name.toLowerCase().includes(q) || p.mrn.toLowerCase().includes(q)).slice(0, 6);
  }, [mention]);

  function resize() {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  function detectMention(value: string, caret: number) {
    if (!mentionPatients) return;
    const m = /(^|\s)@([\w-]{0,20})$/.exec(value.slice(0, caret));
    if (m) {
      setMention({ query: m[2], start: caret - m[2].length - 1 });
      setActive(0);
    } else setMention(null);
  }

  function choose(p: Patient) {
    if (!mention) return;
    const el = ref.current;
    const caret = el?.selectionStart ?? text.length;
    const insert = `@${p.name} `;
    const next = text.slice(0, mention.start) + insert + text.slice(caret);
    setText(next);
    setMentioned((list) => (list.some((x) => x.id === p.id) ? list : [...list, p]));
    setMention(null);
    requestAnimationFrame(() => {
      const pos = mention.start + insert.length;
      el?.focus();
      el?.setSelectionRange(pos, pos);
      resize();
    });
  }

  function insertText(value: string) {
    const el = ref.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    setText(text.slice(0, start) + value + text.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + value.length, start + value.length);
      resize();
    });
  }

  function send() {
    let body = text.trim();
    if ((!body && !files.length) || disabled) return;
    for (const p of mentioned) body = body.split(`@${p.name}`).join(`@[patient:${p.id}]`);
    const result = onSend(body, files);
    if (result instanceof Promise) void result.then((sent) => sent && clear());
    else if (result !== false) clear();
  }

  function clear() {
    setText("");
    setFiles([]);
    setMentioned([]);
    setMention(null);
    requestAnimationFrame(resize);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.nativeEvent.isComposing) return;
    if (mention && matches.length) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => (a + (e.key === "ArrowDown" ? 1 : matches.length - 1)) % matches.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        choose(matches[active]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMention(null);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function onFiles(list: FileList | null) {
    if (!list) return;
    const next = Array.from(list)
      .slice(0, 5)
      .map((f): ChatAttachment => {
        const image = f.type.startsWith("image/");
        return { name: f.name, size: f.size, kind: image ? "image" : "file", url: image ? URL.createObjectURL(f) : undefined };
      });
    setFiles((cur) => [...cur, ...next].slice(0, 5));
    if (fileRef.current) fileRef.current.value = "";
  }

  const listId = `${id}-mentions`;
  const canSend = !disabled && (!!text.trim() || files.length > 0);

  return (
    <div className="relative border-t border-border bg-surface px-3 pb-3 pt-2 sm:px-4">
      {quickReplies && quickReplies.length > 0 && (
        <div className="scrollbar-none -mx-1 mb-2 flex gap-1.5 overflow-x-auto px-1" role="group" aria-label="Quick replies">
          {quickReplies.map((q) => (
            <button
              key={q}
              type="button"
              disabled={disabled}
              onClick={() => insertText(q)}
              className="shrink-0 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium hover:border-brand-400 hover:text-primary disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {mention && matches.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Mention a patient"
          className="absolute bottom-full left-3 right-3 z-20 mb-1 max-w-sm overflow-hidden rounded-2xl border border-border bg-surface p-1 shadow-lift sm:left-4"
        >
          {matches.map((p, i) => (
            <li
              key={p.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(p);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn("flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-sm", i === active && "bg-muted")}
            >
              <ChatAvatar name={p.name} src={p.avatar} size={28} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{p.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {p.mrn} · {p.ward ? `${p.ward}, bed ${p.bed}` : p.condition}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <div className="mb-2">
          <AttachmentList
            items={files}
            onRemove={(i) =>
              setFiles((cur) => {
                const gone = cur[i];
                if (gone?.url) URL.revokeObjectURL(gone.url);
                return cur.filter((_, j) => j !== i);
              })
            }
          />
        </div>
      )}

      <div
        className={cn(
          "flex items-end gap-1 rounded-2xl border bg-background p-1.5 transition-colors focus-within:border-brand-500",
          tone === "urgent" ? "border-red-400 ring-2 ring-red-500/20" : "border-border",
        )}
      >
        <input ref={fileRef} type="file" multiple className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => onFiles(e.target.files)} />
        <button
          type="button"
          disabled={disabled}
          hidden={noAttach}
          onClick={() => fileRef.current?.click()}
          className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
          aria-label="Attach a file"
        >
          <Paperclip className="size-[18px]" aria-hidden />
        </button>
        <label htmlFor={`${id}-input`} className="sr-only">
          {label}
        </label>
        <textarea
          ref={ref}
          id={`${id}-input`}
          rows={1}
          value={text}
          disabled={disabled}
          placeholder={placeholder}
          aria-autocomplete={mentionPatients ? "list" : undefined}
          aria-controls={mention && matches.length ? listId : undefined}
          aria-activedescendant={mention && matches.length ? `${listId}-${active}` : undefined}
          onChange={(e) => {
            setText(e.target.value);
            detectMention(e.target.value, e.target.selectionStart);
            resize();
          }}
          onKeyDown={onKeyDown}
          onBlur={() => setMention(null)}
          className="max-h-40 min-h-9 flex-1 resize-none bg-transparent px-1.5 py-2 text-sm leading-5 placeholder:text-muted-foreground/80 focus:outline-none disabled:opacity-60"
        />
        <EmojiPicker onPick={insertText} />
        {tools}
        <button
          type="button"
          onClick={send}
          disabled={!canSend}
          className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-brand-800 disabled:opacity-40 dark:hover:bg-brand-300"
          aria-label="Send message"
        >
          <SendHorizontal className="size-4" aria-hidden />
        </button>
      </div>
      <p className="mt-1.5 hidden text-[11px] text-muted-foreground sm:block">
        Enter to send · Shift + Enter for a new line{mentionPatients ? " · Type @ to mention a patient" : ""}
      </p>
    </div>
  );
}
