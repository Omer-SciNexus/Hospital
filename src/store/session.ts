"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "@/config/navigation";

export interface Profile {
  name: string;
  email: string;
}

interface SessionState {
  role: Role | null;
  /** Set by the sign-in / sign-up forms. When empty, screens use the role's demo persona. */
  profile: Profile | null;
  signIn: (role: Role, profile?: Profile) => void;
  signOut: () => void;
  updateProfile: (profile: Partial<Profile>) => void;
}

/** Demo session: no real auth. Any email/password works, or pick a role on /sign-in. */
export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      role: null,
      profile: null,
      // No profile means a demo role sign-in: drop the last user's name so the role's persona shows.
      signIn: (role, profile) => set({ role, profile: profile ?? null }),
      signOut: () => set({ role: null, profile: null }),
      updateProfile: (profile) =>
        set((s) => ({ profile: { name: s.profile?.name ?? "", email: s.profile?.email ?? "", ...profile } })),
    }),
    { name: "aurelia-session" },
  ),
);
