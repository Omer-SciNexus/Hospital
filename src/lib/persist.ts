import type { PersistStorage, StorageValue } from "zustand/middleware";

/**
 * localStorage for demo stores whose seed data is relative to "today".
 * It saves the day with the data; when the data is loaded on a later day,
 * every ISO date inside is moved forward by the same number of days, so
 * "2 days ago" stays "2 days ago" and the user's own changes are kept.
 */

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const DAY = 86_400_000;

const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

function shift(value: unknown, ms: number): unknown {
  if (typeof value === "string") return ISO.test(value) ? new Date(new Date(value).getTime() + ms).toISOString() : value;
  if (Array.isArray(value)) return value.map((v) => shift(v, ms));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shift(v, ms)]));
  return value;
}

export function rollingDates<S>(): PersistStorage<S> {
  return {
    getItem: (name) => {
      if (typeof window === "undefined") return null;
      try {
        const raw = localStorage.getItem(name);
        if (!raw) return null;
        const data = JSON.parse(raw) as StorageValue<S> & { savedOn?: number };
        const days = data.savedOn ? Math.round((dayStart(new Date()) - data.savedOn) / DAY) : 0;
        return days > 0 ? { ...data, state: shift(data.state, days * DAY) as S } : data;
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      try {
        localStorage.setItem(name, JSON.stringify({ ...value, savedOn: dayStart(new Date()) }));
      } catch {
        /* storage full or blocked: keep the in-memory state */
      }
    },
    removeItem: (name) => {
      try {
        localStorage.removeItem(name);
      } catch {
        /* ignore */
      }
    },
  };
}
