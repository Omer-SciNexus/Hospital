/**
 * Hospital staff directory for staff chat, the admin staff table and handovers.
 * The first six entries are the demo personas behind each dashboard role.
 * Doctors come from data/doctors.ts and are merged in below.
 */

import type { Role } from "@/config/navigation";
import { doctors } from "./doctors";

export type Presence = "online" | "busy" | "away" | "offline";
export type Shift = "Day" | "Evening" | "Night" | "Off";

export interface StaffMember {
  id: string;
  name: string;
  /** Dashboard role this person would sign in with. */
  role: Role;
  title: string;
  department: string;
  avatar?: string;
  presence: Presence;
  shift: Shift;
  email: string;
  phone: string;
  joined: string;
}

const email = (name: string) =>
  `${name
    .replace(/^Dr\.\s+/, "")
    .replace(/,.*$/, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, ".")}@aurelia-hospital.example`;

/** Persona ids per role, so screens can find "me" in the directory. */
export const personaIds: Record<Role, string> = {
  patient: "maya-robinson",
  doctor: "layla-haddad",
  nurse: "sam-okafor",
  admin: "elena-varga",
  pharmacist: "kenji-mori",
  billing: "priya-nair",
};

const people: Omit<StaffMember, "email">[] = [
  { id: "sam-okafor", name: "Sam Okafor", role: "nurse", title: "Charge Nurse", department: "cardiology", avatar: "/images/dashboard/avatar-03.png", presence: "online", shift: "Day", phone: "ext. 4412", joined: "2017" },
  { id: "elena-varga", name: "Elena Varga", role: "admin", title: "Hospital Administrator", department: "administration", avatar: "/images/dashboard/avatar-04.png", presence: "online", shift: "Day", phone: "ext. 1001", joined: "2014" },
  { id: "kenji-mori", name: "Kenji Mori", role: "pharmacist", title: "Clinical Pharmacist", department: "pharmacy", avatar: "/images/dashboard/avatar-05.png", presence: "busy", shift: "Day", phone: "ext. 2210", joined: "2019" },
  { id: "priya-nair", name: "Priya Nair", role: "billing", title: "Insurance Coordinator", department: "billing", avatar: "/images/dashboard/avatar-06.png", presence: "online", shift: "Day", phone: "ext. 3305", joined: "2020" },
  { id: "grace-lee", name: "Grace Lee", role: "nurse", title: "Staff Nurse", department: "cardiology", presence: "online", shift: "Day", phone: "ext. 4415", joined: "2021" },
  { id: "tom-baker", name: "Tom Baker", role: "nurse", title: "Staff Nurse", department: "cardiology", presence: "away", shift: "Night", phone: "ext. 4418", joined: "2022" },
  { id: "aisha-bello", name: "Aisha Bello", role: "nurse", title: "ICU Nurse", department: "icu", presence: "busy", shift: "Day", phone: "ext. 5120", joined: "2018" },
  { id: "marco-silva", name: "Marco Silva", role: "nurse", title: "Pediatric Nurse", department: "pediatrics", presence: "online", shift: "Evening", phone: "ext. 4602", joined: "2020" },
  { id: "nina-kowalski", name: "Nina Kowalski", role: "nurse", title: "Surgical Nurse", department: "general-surgery", presence: "offline", shift: "Off", phone: "ext. 4710", joined: "2016" },
  { id: "david-cho", name: "David Cho", role: "pharmacist", title: "Lab Technologist", department: "pathology-lab", presence: "online", shift: "Day", phone: "ext. 2302", joined: "2019" },
  { id: "rachel-adams", name: "Rachel Adams", role: "billing", title: "Billing Specialist", department: "billing", presence: "away", shift: "Day", phone: "ext. 3307", joined: "2023" },
  { id: "luis-ortega", name: "Luis Ortega", role: "admin", title: "Operations Manager", department: "administration", presence: "busy", shift: "Day", phone: "ext. 1004", joined: "2015" },
];

const doctorPresence: Presence[] = ["online", "busy", "online", "away", "offline", "online"];

export const staff: StaffMember[] = [
  ...people.map((p) => ({ ...p, email: email(p.name) })),
  ...doctors.map((d, i) => ({
    id: d.id,
    name: d.name,
    role: (d.department === "pharmacy" ? "pharmacist" : "doctor") as Role,
    title: d.title,
    department: d.department,
    avatar: d.photo,
    presence: doctorPresence[i % doctorPresence.length],
    shift: (["Day", "Day", "Evening", "Night", "Off"] as Shift[])[i % 5],
    email: email(d.name),
    phone: `ext. ${3400 + i * 7}`,
    joined: String(2008 + (i % 15)),
  })),
];

export const staffById = Object.fromEntries(staff.map((s) => [s.id, s])) as Record<string, StaffMember>;

export function personaFor(role: Role) {
  return staffById[personaIds[role]];
}
