/**
 * Simple in-memory limits. They reset when the server restarts and are per
 * server instance, which is enough for the demo. Use a shared store such as
 * Redis before running on several instances.
 */

const VISITOR_LIMIT = 40;
const VISITOR_WINDOW_MS = 10 * 60 * 1000;
/** Visitor IPs can be faked, so this total is what really caps AI spending. */
const LIVE_DAILY_LIMIT = 500;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_TRACKED_VISITORS = 5000;

const visitors = new Map<string, { count: number; resetAt: number }>();
let live = { count: 0, resetAt: 0 };

export function takeVisitorSlot(visitor: string, now = Date.now()) {
  if (visitors.size >= MAX_TRACKED_VISITORS) {
    for (const [key, entry] of visitors) if (entry.resetAt <= now) visitors.delete(key);
    if (visitors.size >= MAX_TRACKED_VISITORS) return false;
  }
  const entry = visitors.get(visitor);
  if (!entry || entry.resetAt <= now) {
    visitors.set(visitor, { count: 1, resetAt: now + VISITOR_WINDOW_MS });
    return true;
  }
  if (entry.count >= VISITOR_LIMIT) return false;
  entry.count += 1;
  return true;
}

export function takeLiveSlot(now = Date.now()) {
  if (live.resetAt <= now) live = { count: 0, resetAt: now + DAY_MS };
  if (live.count >= LIVE_DAILY_LIMIT) return false;
  live.count += 1;
  return true;
}

export function resetRateLimits() {
  visitors.clear();
  live = { count: 0, resetAt: 0 };
}
