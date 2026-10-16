/** Date helpers for demo data. Seeds are relative to "now" so the demo never looks stale. */

export function daysFromNow(days: number, time = "09:00") {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

export function formatDay(iso: string) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(new Date(iso));
}

/** "just now", "5 min ago", "3 h ago", "Yesterday", then a short date. */
export function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 60_000;
  if (diff < 1) return "just now";
  if (diff < 60) return `${Math.floor(diff)} min ago`;
  if (diff < 60 * 24) return `${Math.floor(diff / 60)} h ago`;
  if (diff < 60 * 48) return "Yesterday";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(iso));
}

export function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

/** Short reference like "ORD-48213". */
export function makeRef(prefix: string) {
  return `${prefix}-${Math.floor(10000 + Math.random() * 90000)}`;
}
