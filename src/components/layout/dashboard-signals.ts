"use client";

import { useMemo } from "react";
import type { Role } from "@/config/navigation";
import { useChatUnread } from "@/components/chat/use-chat-unread";
import { DEMO_PATIENT_ID, patients } from "@/data/patients";
import { useAppointments } from "@/store/appointments";
import { useInsurance } from "@/store/insurance";
import { useOrders } from "@/store/orders";

export interface Notice {
  id: string;
  title: string;
  text: string;
  href: string;
  tone: "brand" | "blue" | "coral" | "green" | "red";
  /** ISO time, used for sorting and "5 min ago". */
  at: string;
}

/**
 * Live sidebar badges and bell notifications per role, read from the shared
 * stores, so an action in one role (e.g. billing verifies a card) shows up in
 * another role's bell.
 */
export function useDashboardSignals(role: Role) {
  const orders = useOrders((s) => s.orders);
  const cards = useInsurance((s) => s.cards);
  const claims = useInsurance((s) => s.claims);
  const preapprovals = useInsurance((s) => s.preapprovals);
  const appointments = useAppointments((s) => s.appointments);
  const staffUnread = useChatUnread(role, "staff");
  const careUnread = useChatUnread(role, "care");

  return useMemo(() => {
    const badges: Record<string, number> = {
      "/dashboard/staff-chat": staffUnread,
      "/dashboard/messages": careUnread,
    };
    const notices: Notice[] = [];
    const now = new Date().toISOString();

    if (role === "patient") {
      const mine = <T extends { patientId: string }>(list: T[]) => list.filter((x) => x.patientId === DEMO_PATIENT_ID);
      const upcoming = mine(appointments).filter((a) => a.status === "upcoming");
      const active = mine(orders).filter((o) => !["delivered", "cancelled"].includes(o.status));
      badges["/dashboard/appointments"] = upcoming.length;
      badges["/dashboard/orders"] = active.length;
      for (const c of mine(cards).filter((c) => c.decidedAt && c.status !== "pending")) {
        notices.push({
          id: `card-${c.id}-${c.status}`,
          title: c.status === "verified" ? "Insurance card verified" : "Insurance card needs attention",
          text: c.status === "verified" ? "Your coverage now shows at booking and checkout." : (c.note ?? "Billing could not verify your card."),
          href: "/dashboard/insurance",
          tone: c.status === "verified" ? "green" : "red",
          at: c.decidedAt!,
        });
      }
      for (const c of mine(claims).filter((c) => c.decidedAt)) {
        notices.push({
          id: `claim-${c.id}-${c.status}`,
          title: `Claim ${c.status === "denied" ? "denied" : c.status === "partial" ? "partly approved" : "approved"}`,
          text: c.title,
          href: "/dashboard/insurance",
          tone: c.status === "denied" ? "red" : c.status === "partial" ? "coral" : "green",
          at: c.decidedAt!,
        });
      }
      for (const p of mine(preapprovals).filter((p) => p.decidedAt && (p.status === "approved" || p.status === "denied"))) {
        notices.push({
          id: `pa-${p.id}-${p.status}`,
          title: p.status === "approved" ? "Pre-approval granted" : "Pre-approval denied",
          text: p.note ? `${p.procedure}: ${p.note}` : p.procedure,
          href: "/dashboard/insurance#preapprovals",
          tone: p.status === "approved" ? "green" : "red",
          at: p.decidedAt!,
        });
      }
      for (const o of mine(orders).filter((o) => o.rx?.reviewedAt)) {
        notices.push({
          id: `rx-${o.id}-${o.rx!.status}`,
          title: o.rx!.status === "approved" ? "Prescription approved" : "Prescription not accepted",
          text: o.rx!.status === "approved" ? `Order ${o.id} is being prepared.` : (o.rx!.note ?? `Order ${o.id} was cancelled.`),
          href: "/dashboard/orders",
          tone: o.rx!.status === "approved" ? "green" : "red",
          at: o.rx!.reviewedAt!,
        });
      }
      const next = upcoming.sort((a, b) => a.start.localeCompare(b.start))[0];
      if (next) notices.push({ id: `apt-${next.id}`, title: "Upcoming visit", text: next.reason, href: "/dashboard/appointments", tone: "blue", at: now });
    }

    if (role === "pharmacist") {
      const rx = orders.filter((o) => o.rx?.status === "pending");
      const lab = orders.filter((o) => o.lab && o.lab.status !== "resulted");
      badges["/dashboard/rx-queue"] = rx.length;
      badges["/dashboard/lab-queue"] = lab.length;
      for (const o of rx) notices.push({ id: `rxq-${o.id}`, title: "Prescription to verify", text: `${o.patientName} · ${o.id}`, href: "/dashboard/rx-queue", tone: "coral", at: o.createdAt });
    }

    if (role === "billing") {
      const pending = cards.filter((c) => c.status === "pending");
      const drafts = claims.filter((c) => c.status === "draft");
      const pa = preapprovals.filter((p) => p.status === "requested" || p.status === "in-review");
      badges["/dashboard/verifications"] = pending.length;
      badges["/dashboard/claims"] = drafts.length;
      badges["/dashboard/preapprovals"] = pa.length;
      for (const c of pending) notices.push({ id: `cardq-${c.id}`, title: "Insurance card to check", text: c.holder, href: "/dashboard/verifications", tone: "coral", at: c.addedAt });
      for (const p of pa.filter((p) => p.status === "requested")) notices.push({ id: `paq-${p.id}`, title: `Pre-approval request${p.urgency === "urgent" ? " (urgent)" : ""}`, text: p.procedure, href: "/dashboard/preapprovals", tone: p.urgency === "urgent" ? "red" : "blue", at: p.requestedAt });
    }

    if (role === "doctor" || role === "nurse") {
      for (const p of patients.filter((p) => p.news >= 5)) {
        notices.push({ id: `news-${p.id}`, title: `Early warning: NEWS ${p.news}`, text: `${p.name} · ${p.ward ?? ""} bed ${p.bed ?? "-"}`, href: `/dashboard/patients/${p.id}`, tone: "red", at: now });
      }
    }

    if (role === "admin") {
      const pending = cards.filter((c) => c.status === "pending").length;
      if (pending) notices.push({ id: "admin-cards", title: `${pending} insurance cards waiting`, text: "Billing queue", href: "/dashboard", tone: "coral", at: now });
      notices.push({ id: "admin-stock", title: "Low stock alert", text: "IV sets and nitrile gloves below reorder level", href: "/dashboard/inventory", tone: "red", at: now });
    }

    notices.sort((a, b) => b.at.localeCompare(a.at));
    return { badges, notices: notices.slice(0, 8) };
  }, [role, orders, cards, claims, preapprovals, appointments, staffUnread, careUnread]);
}
