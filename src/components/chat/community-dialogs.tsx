"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldAlert } from "lucide-react";
import { site } from "@/config/site";
import { nickAvatar } from "@/data/chat";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { FieldError, Input, Label, Textarea } from "@/components/ui/form-controls";

/* ------------------------------------------------- community profile (local) */

export const PROFILE_KEY = "aurelia-community-profile";
export const ACK_KEY = "aurelia-community-ack";

export interface CommunityProfile {
  nickname: string;
  avatar: string;
}

/** Accepts "/images/dashboard/nick-avatar-03.png", "nick-avatar-03", "3"… and returns the image path. */
function normalizeAvatar(value: unknown) {
  const m = /(\d)(?:\.png)?$/.exec(String(value ?? ""));
  const n = m ? Number(m[1]) : 1;
  return nickAvatar(n >= 1 && n <= 6 ? n : 1);
}

export function readProfile(): CommunityProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<CommunityProfile>;
    if (!data.nickname?.trim()) return null;
    return { nickname: data.nickname.trim(), avatar: normalizeAvatar(data.avatar) };
  } catch {
    return null;
  }
}

export function saveProfile(p: CommunityProfile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  } catch {
    /* storage blocked: keep in memory only */
  }
}

export function readAck() {
  try {
    return localStorage.getItem(ACK_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveAck() {
  try {
    localStorage.setItem(ACK_KEY, "1");
  } catch {
    /* ignore */
  }
}

/* ----------------------------------------------------------------- dialogs */

const rules = [
  "Be kind. Everyone here is going through something.",
  "Use a nickname. Don't share your full name, MRN, address or phone.",
  "Keep personal medical details for your private Care chat.",
  "Posts are not medical advice. Always check with your own care team.",
  `In an emergency, call ${site.emergencyPhone} right away.`,
  "No ads, spam or selling. Report posts that break the rules.",
];

export function GuidelinesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <div className="flex flex-col items-center text-center">
          <Image src="/images/dashboard/community-guidelines.png" alt="" width={180} height={180} className="size-32" />
          <DialogTitle className="mt-2 pr-0">Community guidelines</DialogTitle>
          <DialogDescription>A safe, friendly place to share and support each other.</DialogDescription>
        </div>
        <ol className="mt-5 space-y-2.5 text-sm">
          {rules.map((r, i) => (
            <li key={r} className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-800 dark:bg-brand-950 dark:text-brand-200">{i + 1}</span>
              {r}
            </li>
          ))}
        </ol>
        <p className="mt-4 rounded-2xl bg-surface-2 p-3 text-xs text-muted-foreground">
          Moderators (doctors, nurses and admins) can pin, lock or archive topics and hide posts. Staff may move a post to a private Care chat to protect your privacy.
        </p>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Privacy warning before the first post; patients also pick a nickname and avatar. */
export function FirstPostDialog({
  open,
  onOpenChange,
  needNickname,
  needAck,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  needNickname: boolean;
  needAck: boolean;
  onDone: (profile: CommunityProfile | null) => void;
}) {
  const schema = useMemo(
    () =>
      z.object({
        nickname: needNickname
          ? z
              .string()
              .trim()
              .min(2, "Use at least 2 characters")
              .max(24, "Keep it under 24 characters")
              .regex(/^[\w .-]+$/, "Letters, numbers, spaces, dots and dashes only")
          : z.string().optional(),
        avatar: z.string(),
        agree: needAck ? z.literal(true, { message: "Please confirm to continue" }) : z.boolean().optional(),
      }),
    [needNickname, needAck],
  );
  type Values = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { nickname: "", avatar: nickAvatar(1), agree: undefined } });
  const avatar = watch("avatar");
  const agree = watch("agree");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogTitle>{needNickname ? "Pick a nickname" : "Before you post"}</DialogTitle>
        <DialogDescription>The community is public to all signed-in patients and staff.</DialogDescription>
        <form
          noValidate
          onSubmit={handleSubmit((v) => {
            if (needAck) saveAck();
            let profile: CommunityProfile | null = null;
            if (needNickname && v.nickname) {
              profile = { nickname: v.nickname.trim(), avatar: v.avatar };
              saveProfile(profile);
            }
            onDone(profile);
            onOpenChange(false);
          })}
          className="mt-5 space-y-5"
        >
          <div className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100">
            <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
            <p>
              Don&apos;t share personal medical details, your full name, MRN or address here. For questions about your own care, use your private Care chat. Posts are not medical advice.
            </p>
          </div>

          {needNickname && (
            <>
              <div className="space-y-2">
                <Label htmlFor="cp-nick">Nickname</Label>
                <Input id="cp-nick" placeholder="For example: SunnyWalker" autoComplete="off" aria-invalid={!!errors.nickname} {...register("nickname")} />
                <FieldError message={errors.nickname?.message} />
                <p className="text-xs text-muted-foreground">Other members see this name, never your real one.</p>
              </div>
              <fieldset>
                <legend className="text-sm font-semibold">Avatar</legend>
                <div className="mt-2 grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((n) => {
                    const src = nickAvatar(n);
                    return (
                      <label
                        key={n}
                        className={cn(
                          "relative aspect-square cursor-pointer overflow-hidden rounded-full ring-2 transition has-[:focus-visible]:ring-brand-500",
                          avatar === src ? "ring-primary" : "ring-transparent hover:ring-border",
                        )}
                      >
                        <input type="radio" value={src} className="sr-only" aria-label={`Avatar ${n}`} {...register("avatar")} />
                        <Image src={src} alt="" fill sizes="96px" className="object-cover" />
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </>
          )}

          {needAck && (
            <div className="space-y-1.5">
              <div className="flex items-start gap-3">
                <Checkbox id="cp-agree" checked={agree === true} onCheckedChange={(c) => setValue("agree", c === true ? true : undefined, { shouldValidate: true })} aria-invalid={!!errors.agree} />
                <Label htmlFor="cp-agree" className="font-normal">
                  I understand. I won&apos;t share private medical details and I&apos;ll follow the community guidelines.
                </Label>
              </div>
              <FieldError message={errors.agree?.message} />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Continue and post</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const topicSchema = z.object({
  name: z.string().trim().min(3, "Use at least 3 characters").max(40, "Keep it under 40 characters"),
  description: z.string().trim().min(10, "Write at least 10 characters").max(140, "Keep it under 140 characters"),
});
type TopicValues = z.infer<typeof topicSchema>;

/** Anyone can create a topic; it goes live right away. */
export function CreateTopicDialog({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (o: boolean) => void; onCreate: (v: TopicValues) => void }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TopicValues>({ resolver: zodResolver(topicSchema) });
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent size="sm">
        <div className="flex items-center gap-3">
          <Image src="/images/icons/community/custom.png" alt="" width={56} height={56} className="size-12 rounded-xl" />
          <div>
            <DialogTitle>New topic</DialogTitle>
            <DialogDescription className="mt-0.5">It goes live right away for everyone.</DialogDescription>
          </div>
        </div>
        <form
          noValidate
          onSubmit={handleSubmit((v) => {
            onCreate(v);
            reset();
            onOpenChange(false);
          })}
          className="mt-5 space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="nt-name">Topic name</Label>
            <Input id="nt-name" placeholder="For example: Living with asthma" aria-invalid={!!errors.name} {...register("name")} />
            <FieldError message={errors.name?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nt-desc">Short description</Label>
            <Textarea id="nt-desc" className="min-h-20" placeholder="Who is it for? What do you want to talk about?" aria-invalid={!!errors.description} {...register("description")} />
            <FieldError message={errors.description?.message} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create topic</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export const reportReasons = [
  "Shares personal medical details",
  "Spam or advertising",
  "Harassment or abuse",
  "Wrong or harmful health advice",
  "Something else",
];

export function ReportDialog({ open, onOpenChange, onReport }: { open: boolean; onOpenChange: (o: boolean) => void; onReport: (reason: string) => void }) {
  const [reason, setReason] = useState(reportReasons[0]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogTitle>Report this post</DialogTitle>
        <DialogDescription>Moderators will review it. The author won&apos;t know who reported it.</DialogDescription>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onReport(reason);
            onOpenChange(false);
          }}
        >
          <fieldset className="mt-4 space-y-1.5">
            <legend className="sr-only">Reason</legend>
            {reportReasons.map((r) => (
              <label
                key={r}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500",
                  reason === r ? "border-brand-500 bg-brand-50 dark:bg-brand-950" : "border-border",
                )}
              >
                <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-[var(--primary)]" />
                {r}
              </label>
            ))}
          </fieldset>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger">
              Send report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MoveToPrivateDialog({ open, onOpenChange, authorName, onConfirm }: { open: boolean; onOpenChange: (o: boolean) => void; authorName: string; onConfirm: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <div className="flex flex-col items-center text-center">
          <Image src="/images/dashboard/moved-to-private.png" alt="" width={160} height={160} className="size-28" />
          <DialogTitle className="mt-2 pr-0">Move to a private care chat?</DialogTitle>
          <DialogDescription>
            We&apos;ll start a private Care chat with {authorName} and replace the public post with a short note. Use this when someone shares personal medical details.
          </DialogDescription>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Move to private chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
