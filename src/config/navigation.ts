/** Public site navigation and per-role dashboard navigation. Icons are lucide-react names. */

export const mainNav = [
  { label: "Departments", href: "/departments", mega: true },
  { label: "Doctors", href: "/doctors" },
  { label: "Services", href: "/services" },
  { label: "Marketplace", href: "/marketplace", highlight: true },
  { label: "Insurance", href: "/insurance" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export const footerNav = [
  {
    title: "Patients",
    links: [
      { label: "Find a doctor", href: "/doctors" },
      { label: "Book an appointment", href: "/doctors" },
      { label: "Accepted insurance", href: "/insurance" },
      { label: "Patient portal", href: "/sign-in" },
      { label: "Emergency", href: "/emergency" },
    ],
  },
  {
    title: "Care",
    links: [
      { label: "All departments", href: "/departments" },
      { label: "Health packages", href: "/services#packages" },
      { label: "Lab tests", href: "/services#tests" },
      { label: "Telemedicine", href: "/services#care" },
      { label: "Marketplace", href: "/marketplace" },
    ],
  },
  {
    title: "Hospital",
    links: [
      { label: "About us", href: "/about" },
      { label: "Health blog", href: "/blog" },
      { label: "Careers", href: "/about#careers" },
      { label: "Contact", href: "/contact" },
    ],
  },
] as const;

export type Role = "patient" | "doctor" | "nurse" | "admin" | "pharmacist" | "billing";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string;
}

export const roles: { id: Role; label: string; description: string; avatar: string; person: string }[] = [
  { id: "patient", label: "Patient", description: "Appointments, orders, results and insurance", avatar: "/images/dashboard/avatar-01.png", person: "Maya Robinson" },
  { id: "doctor", label: "Doctor", description: "Schedule, patient list and visit notes", avatar: "/images/doctors/dr-01.png", person: "Dr. Layla Haddad" },
  { id: "nurse", label: "Nurse", description: "Ward board, vitals and medication rounds", avatar: "/images/dashboard/avatar-03.png", person: "Sam Okafor" },
  { id: "admin", label: "Admin", description: "Staff, departments, inventory and analytics", avatar: "/images/dashboard/avatar-04.png", person: "Elena Varga" },
  { id: "pharmacist", label: "Pharmacist / Lab", description: "Prescriptions to verify, tests to process", avatar: "/images/dashboard/avatar-05.png", person: "Kenji Mori" },
  { id: "billing", label: "Billing / Insurance", description: "Verify cards, claims and pre-approvals", avatar: "/images/dashboard/avatar-06.png", person: "Priya Nair" },
];

const chat: NavItem = { label: "Messages", href: "/dashboard/messages", icon: "MessageCircle" };
const community: NavItem = { label: "Community", href: "/dashboard/community", icon: "Users" };
const settings: NavItem = { label: "Settings", href: "/dashboard/settings", icon: "Settings" };

export const dashboardNav: Record<Role, NavItem[]> = {
  patient: [
    { label: "Overview", href: "/dashboard", icon: "LayoutDashboard" },
    { label: "Appointments", href: "/dashboard/appointments", icon: "CalendarDays" },
    { label: "Orders", href: "/dashboard/orders", icon: "ShoppingBag" },
    { label: "Results & records", href: "/dashboard/records", icon: "FileHeart" },
    { label: "Prescriptions", href: "/dashboard/prescriptions", icon: "Pill" },
    { label: "Insurance", href: "/dashboard/insurance", icon: "ShieldCheck" },
    { ...chat, label: "Care chat" },
    community,
    settings,
  ],
  doctor: [
    { label: "Overview", href: "/dashboard", icon: "LayoutDashboard" },
    { label: "Schedule", href: "/dashboard/schedule", icon: "CalendarDays" },
    { label: "Patients", href: "/dashboard/patients", icon: "Users" },
    { label: "Visit notes", href: "/dashboard/notes", icon: "NotebookPen" },
    { label: "Lab results", href: "/dashboard/results", icon: "FlaskConical" },
    { label: "Staff chat", href: "/dashboard/staff-chat", icon: "MessagesSquare" },
    chat,
    community,
    settings,
  ],
  nurse: [
    { label: "Overview", href: "/dashboard", icon: "LayoutDashboard" },
    { label: "Ward board", href: "/dashboard/ward", icon: "BedDouble" },
    { label: "Vitals", href: "/dashboard/vitals", icon: "Activity" },
    { label: "Medication rounds", href: "/dashboard/rounds", icon: "Pill" },
    { label: "Handover", href: "/dashboard/handover", icon: "ClipboardList" },
    { label: "Staff chat", href: "/dashboard/staff-chat", icon: "MessagesSquare" },
    { ...chat, label: "Care chat" },
    community,
    settings,
  ],
  admin: [
    { label: "Overview", href: "/dashboard", icon: "LayoutDashboard" },
    { label: "Analytics", href: "/dashboard/analytics", icon: "ChartLine" },
    { label: "Staff", href: "/dashboard/staff", icon: "IdCard" },
    { label: "Departments", href: "/dashboard/departments", icon: "Building2" },
    { label: "Inventory", href: "/dashboard/inventory", icon: "Boxes" },
    { label: "Marketplace", href: "/dashboard/catalog", icon: "Store" },
    { label: "Staff chat", href: "/dashboard/staff-chat", icon: "MessagesSquare" },
    { ...community, label: "Moderation" },
    settings,
  ],
  pharmacist: [
    { label: "Overview", href: "/dashboard", icon: "LayoutDashboard" },
    { label: "Rx to verify", href: "/dashboard/rx-queue", icon: "Pill" },
    { label: "Lab queue", href: "/dashboard/lab-queue", icon: "FlaskConical" },
    { label: "Stock", href: "/dashboard/stock", icon: "Boxes" },
    { label: "Staff chat", href: "/dashboard/staff-chat", icon: "MessagesSquare" },
    chat,
    community,
    settings,
  ],
  billing: [
    { label: "Overview", href: "/dashboard", icon: "LayoutDashboard" },
    { label: "Card checks", href: "/dashboard/verifications", icon: "IdCard" },
    { label: "Claims", href: "/dashboard/claims", icon: "FileCheck" },
    { label: "Pre-approvals", href: "/dashboard/preapprovals", icon: "CalendarCheck" },
    { label: "Invoices", href: "/dashboard/invoices", icon: "Receipt" },
    { label: "Staff chat", href: "/dashboard/staff-chat", icon: "MessagesSquare" },
    chat,
    community,
    settings,
  ],
};
