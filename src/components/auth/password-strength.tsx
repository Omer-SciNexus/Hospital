import { cn } from "@/lib/utils";

/** 0–4 score from length and character variety. Good enough for a demo meter. */
export function passwordScore(value: string) {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 6) score++;
  if (value.length >= 10) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score++;
  return Math.min(4, score);
}

const levels = [
  { label: "Too short", bar: "bg-muted", text: "text-muted-foreground" },
  { label: "Weak", bar: "bg-red-500", text: "text-red-600 dark:text-red-400" },
  { label: "Fair", bar: "bg-amber-500", text: "text-amber-700 dark:text-amber-300" },
  { label: "Good", bar: "bg-brand-500", text: "text-brand-700 dark:text-brand-300" },
  { label: "Strong", bar: "bg-green-600", text: "text-green-700 dark:text-green-300" },
];

/** Four-segment strength bar with a short label under a password field. */
export function PasswordStrength({ value }: { value: string }) {
  const score = passwordScore(value);
  const level = levels[score];
  return (
    <div className="space-y-1.5" aria-live="polite">
      <div className="grid grid-cols-4 gap-1.5" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={cn("h-1.5 rounded-full transition-colors", i <= score ? level.bar : "bg-muted")} />
        ))}
      </div>
      <p className="flex justify-between text-xs">
        <span className={cn("font-semibold", level.text)}>Password strength: {value ? level.label : "-"}</span>
        <span className="text-muted-foreground">Use 10+ characters, a number and a symbol</span>
      </p>
    </div>
  );
}
