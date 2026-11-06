"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Camera, Check, Download, Laptop, LogOut, Moon, RotateCcw, Save, Sun } from "lucide-react";
import { roles } from "@/config/navigation";
import { useAdmin } from "@/store/admin";
import { useAppointments } from "@/store/appointments";
import { useBilling } from "@/store/billing";
import { useCart } from "@/store/cart";
import { useChat } from "@/store/chat";
import { useClinical } from "@/store/clinical";
import { useInsurance } from "@/store/insurance";
import { useOrders } from "@/store/orders";
import { usePharmacy } from "@/store/pharmacy";
import { useSession } from "@/store/session";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { FieldError, Input, Label, NativeSelect } from "@/components/ui/form-controls";
import { Switch } from "@/components/ui/switch";
import { PageHeader, Panel } from "@/components/dashboard/page-header";

const EXTRA_KEY = "aurelia-profile-extra";
const THEME_KEY = "aurelia-theme";
/** Read by the community chat to show the patient's nickname and nick avatar. */
export const COMMUNITY_KEY = "aurelia-community-profile";

const languages = ["English", "Spanish", "French", "Arabic", "Chinese", "Hindi", "Portuguese", "German"];

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/** Settings for every role. The Community section only shows for patients. */
export function SettingsScreen() {
  const role = useSession((s) => s.role) ?? "patient";
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Account" title="Settings" description="Your profile, notifications, look and privacy. Changes save on this device." />
      <div className="space-y-6">
        <ProfileSection />
        <NotificationsSection />
        <AppearanceSection />
        <PrivacySection />
        {role === "patient" && <CommunitySection />}
        <DemoDataSection />
      </div>
    </div>
  );
}

const profileSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name"),
  email: z.email("Please enter a valid email"),
  phone: z.string().trim().regex(/^[+()\d\s-]{7,20}$/, "Please enter a valid phone number").or(z.literal("")),
  language: z.string(),
});
type ProfileValues = z.infer<typeof profileSchema>;

function ProfileSection() {
  const role = useSession((s) => s.role) ?? "patient";
  const profile = useSession((s) => s.profile);
  const updateProfile = useSession((s) => s.updateProfile);
  const persona = roles.find((r) => r.id === role)!;
  const name = profile?.name || persona.person;
  const email = profile?.email || `${persona.person.toLowerCase().replace(/^dr\.\s*/, "").replace(/\s+/g, ".")}@example.com`;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name, email, phone: "", language: "English" },
  });

  useEffect(() => {
    const extra = readJson(EXTRA_KEY, { phone: "+1 (555) 014-7781", language: "English" });
    reset({ name, email, phone: extra.phone, language: extra.language });
  }, [reset, name, email]);

  async function onSubmit(v: ProfileValues) {
    await new Promise((r) => setTimeout(r, 500));
    updateProfile({ name: v.name, email: v.email });
    writeJson(EXTRA_KEY, { phone: v.phone, language: v.language });
    reset(v);
    toast.success("Profile saved");
  }

  return (
    <Panel title="Profile" description="How you appear to your care team">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-6 md:grid-cols-[auto_1fr]">
        <div className="flex flex-row items-center gap-4 md:flex-col">
          <span className="relative size-24 overflow-hidden rounded-full bg-brand-50 ring-4 ring-surface-2">
            <Image src={persona.avatar} alt="" fill sizes="192px" className="object-cover object-top" />
          </span>
          <Button type="button" size="sm" variant="soft" onClick={() => toast.info("Photo upload is not part of this demo")}>
            <Camera aria-hidden /> Change photo
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="set-name">Full name</Label>
            <Input id="set-name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
            <FieldError message={errors.name?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="set-email">Email</Label>
            <Input id="set-email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
            <FieldError message={errors.email?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="set-phone">Phone</Label>
            <Input id="set-phone" type="tel" autoComplete="tel" aria-invalid={!!errors.phone} {...register("phone")} />
            <FieldError message={errors.phone?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="set-language">Language</Label>
            <NativeSelect id="set-language" {...register("language")}>
              {languages.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </NativeSelect>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              <Save aria-hidden /> {isSubmitting ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </form>
    </Panel>
  );
}

const notificationItems = [
  { id: "appointments", label: "Appointment reminders", text: "A day before and an hour before each visit" },
  { id: "orders", label: "Order updates", text: "When an order ships, arrives or needs a prescription" },
  { id: "results", label: "Results ready", text: "When new lab results are in your records" },
  { id: "chat", label: "Chat messages", text: "New messages from care chat and community" },
  { id: "digest", label: "Weekly email digest", text: "A short summary every Monday" },
];

function SwitchRow({ id, label, text, checked, onChange }: { id: string; label: string; text: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <li className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-muted-foreground">{text}</span>
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </li>
  );
}

function NotificationsSection() {
  const [on, setOn] = useState<Record<string, boolean>>({ appointments: true, orders: true, results: true, chat: true, digest: false });
  return (
    <Panel title="Notifications" description="Choose what we tell you about">
      <ul className="divide-y divide-border">
        {notificationItems.map((n) => (
          <SwitchRow
            key={n.id}
            id={`notif-${n.id}`}
            label={n.label}
            text={n.text}
            checked={on[n.id]}
            onChange={(v) => {
              setOn((s) => ({ ...s, [n.id]: v }));
              toast.success(`${n.label} ${v ? "on" : "off"}`);
            }}
          />
        ))}
      </ul>
    </Panel>
  );
}

type Theme = "light" | "dark" | "system";

function applyTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
}

function AppearanceSection() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(THEME_KEY);
    } catch {}
    setTheme(saved === "system" ? "system" : document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const options = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Laptop },
  ] as const;

  return (
    <Panel title="Appearance" description="System follows your device setting">
      <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-3">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={theme === o.id}
            onClick={() => {
              setTheme(o.id);
              applyTheme(o.id);
              toast.success(`${o.label} theme on`);
            }}
            className={cn(
              "relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-sm font-semibold transition-colors",
              theme === o.id ? "border-brand-500 bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200" : "border-border hover:border-brand-400",
            )}
          >
            <o.icon className="size-6" aria-hidden />
            {o.label}
            {theme === o.id && <Check className="absolute right-2 top-2 size-4" aria-hidden />}
          </button>
        ))}
      </div>
    </Panel>
  );
}

function PrivacySection() {
  const [twoStep, setTwoStep] = useState(false);
  return (
    <Panel title="Privacy & security">
      <ul className="divide-y divide-border">
        <SwitchRow
          id="sec-2fa"
          label="2-step login"
          text="We send a code to your phone when you sign in on a new device"
          checked={twoStep}
          onChange={(v) => {
            setTwoStep(v);
            toast.success(v ? "2-step login turned on" : "2-step login turned off");
          }}
        />
      </ul>
      <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-5">
        <Button variant="outline" onClick={() => toast.success("Signed out of 2 other devices")}>
          <LogOut aria-hidden /> Sign out of other devices
        </Button>
        <Button variant="outline" onClick={() => toast.success("We are preparing your data", { description: "You will get an email with a download link within 24 hours." })}>
          <Download aria-hidden /> Download my data
        </Button>
      </div>
    </Panel>
  );
}

const nickAvatars = Array.from({ length: 6 }, (_, i) => `/images/dashboard/nick-avatar-0${i + 1}.png`);

const communitySchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(3, "At least 3 characters")
    .max(20, "20 characters or less")
    .regex(/^[\w .-]+$/, "Letters, numbers, spaces, dots and dashes only"),
});

function CommunitySection() {
  const [avatar, setAvatar] = useState(nickAvatars[0]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof communitySchema>>({ resolver: zodResolver(communitySchema), defaultValues: { nickname: "" } });

  useEffect(() => {
    const saved = readJson(COMMUNITY_KEY, { nickname: "HeartSmart34", avatar: nickAvatars[0] });
    reset({ nickname: saved.nickname });
    setAvatar(saved.avatar);
  }, [reset]);

  return (
    <Panel title="Community profile" description="Other members see only this nickname and picture, never your real name">
      <form
        noValidate
        onSubmit={handleSubmit((v) => {
          writeJson(COMMUNITY_KEY, { nickname: v.nickname, avatar });
          toast.success("Community profile saved", { description: `You will appear as ${v.nickname}.` });
        })}
        className="space-y-5"
      >
        <div className="max-w-sm space-y-2">
          <Label htmlFor="nick">Nickname</Label>
          <Input id="nick" aria-invalid={!!errors.nickname} {...register("nickname")} />
          <FieldError message={errors.nickname?.message} />
        </div>
        <fieldset>
          <legend className="text-sm font-semibold">Picture</legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {nickAvatars.map((src, i) => (
              <button
                key={src}
                type="button"
                aria-pressed={avatar === src}
                aria-label={`Avatar ${i + 1}`}
                onClick={() => setAvatar(src)}
                className={cn(
                  "relative size-16 overflow-hidden rounded-full ring-2 ring-offset-2 ring-offset-surface transition-all",
                  avatar === src ? "ring-brand-500" : "ring-transparent hover:ring-border",
                )}
              >
                <Image src={src} alt="" fill sizes="128px" className="object-cover" />
              </button>
            ))}
          </div>
        </fieldset>
        <Button type="submit">
          <Save aria-hidden /> Save community profile
        </Button>
      </form>
    </Panel>
  );
}

function DemoDataSection() {
  const [open, setOpen] = useState(false);
  const resetOrders = useOrders((s) => s.reset);
  const resetAppointments = useAppointments((s) => s.reset);
  const resetInsurance = useInsurance((s) => s.reset);
  const resetClinical = useClinical((s) => s.reset);
  const resetBilling = useBilling((s) => s.reset);
  const resetPharmacy = usePharmacy((s) => s.reset);
  const resetAdmin = useAdmin((s) => s.reset);
  const resetChat = useChat((s) => s.reset);
  const clearCart = useCart((s) => s.clear);

  return (
    <Panel title="Demo data" description="Undo everything you changed while trying the demo">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Resets orders, appointments, insurance, clinical records, invoices, pharmacy stock, staff and catalog edits, messages and community posts, and empties the cart.
        </p>
        <Button variant="outline" className="border-red-200 text-red-600 hover:border-red-400 hover:text-red-700 dark:border-red-900 dark:text-red-400" onClick={() => setOpen(true)}>
          <RotateCcw aria-hidden /> Reset demo data
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="sm">
          <DialogTitle>Reset demo data?</DialogTitle>
          <DialogDescription>All roles will see the starting demo data again. Your sign-in stays as it is.</DialogDescription>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              variant="danger"
              onClick={() => {
                resetOrders();
                resetAppointments();
                resetInsurance();
                resetClinical();
                resetBilling();
                resetPharmacy();
                resetAdmin();
                resetChat();
                clearCart();
                setOpen(false);
                toast.success("Demo data reset");
              }}
            >
              <RotateCcw aria-hidden /> Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}
