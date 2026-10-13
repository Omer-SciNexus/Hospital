export interface HealthPackage {
  id: string;
  name: string;
  image: string;
  price: number;
  oldPrice?: number;
  tests: number;
  audience: string;
  includes: string[];
  turnaround: string;
  popular?: boolean;
}

export interface LabTest {
  id: string;
  name: string;
  image?: string;
  price: number;
  sample: string;
  turnaround: string;
  fasting: boolean;
}

export const healthPackages: HealthPackage[] = [
  {
    id: "full-body",
    name: "Full Body Check-up",
    image: "/images/services/pkg-full-body.png",
    price: 199,
    oldPrice: 279,
    tests: 86,
    audience: "Adults 18+",
    includes: ["Complete blood count", "Liver and kidney panel", "Lipid profile", "Thyroid panel", "Vitamin D and B12", "Doctor review"],
    turnaround: "Results in 24h",
    popular: true,
  },
  {
    id: "cardiac",
    name: "Heart Health Screen",
    image: "/images/services/pkg-cardiac.png",
    price: 249,
    oldPrice: 320,
    tests: 42,
    audience: "Adults 35+",
    includes: ["ECG", "Echocardiogram", "Lipid profile", "hs-CRP", "HbA1c", "Cardiologist consult"],
    turnaround: "Same day",
  },
  {
    id: "diabetes",
    name: "Diabetes Care Panel",
    image: "/images/services/pkg-diabetes.png",
    price: 89,
    tests: 28,
    audience: "Diabetes or pre-diabetes",
    includes: ["HbA1c", "Fasting glucose", "Kidney panel", "Urine microalbumin", "Lipid profile", "Diet consult"],
    turnaround: "Results in 24h",
  },
  {
    id: "women",
    name: "Women's Wellness",
    image: "/images/services/pkg-women.png",
    price: 229,
    oldPrice: 290,
    tests: 64,
    audience: "Women 21+",
    includes: ["Pap smear", "Breast ultrasound", "Hormone panel", "Iron studies", "Thyroid panel", "Gynecologist consult"],
    turnaround: "Results in 48h",
    popular: true,
  },
  {
    id: "senior",
    name: "Senior Care Plus",
    image: "/images/services/pkg-senior.png",
    price: 299,
    tests: 92,
    audience: "Adults 60+",
    includes: ["Bone density scan", "Cardiac screen", "Memory check", "Eye and hearing tests", "Kidney panel", "Geriatric consult"],
    turnaround: "Results in 48h",
  },
  {
    id: "child",
    name: "Child Growth Check",
    image: "/images/services/pkg-child.png",
    price: 79,
    tests: 24,
    audience: "Ages 2–12",
    includes: ["Growth assessment", "Complete blood count", "Iron and vitamin D", "Vision and hearing", "Vaccination review", "Pediatrician consult"],
    turnaround: "Same day",
  },
];

export const labTests: LabTest[] = [
  { id: "cbc", name: "Complete Blood Count (CBC)", image: "/images/services/test-blood.png", price: 19, sample: "Blood", turnaround: "6 hours", fasting: false },
  { id: "thyroid", name: "Thyroid Panel (TSH, T3, T4)", image: "/images/services/test-thyroid.png", price: 35, sample: "Blood", turnaround: "12 hours", fasting: false },
  { id: "vitamin-d", name: "Vitamin D (25-OH)", image: "/images/services/test-vitamin.png", price: 29, sample: "Blood", turnaround: "24 hours", fasting: false },
  { id: "lipid", name: "Lipid Profile", price: 25, sample: "Blood", turnaround: "12 hours", fasting: true },
  { id: "hba1c", name: "HbA1c", price: 22, sample: "Blood", turnaround: "12 hours", fasting: false },
  { id: "liver", name: "Liver Function Test", price: 32, sample: "Blood", turnaround: "12 hours", fasting: true },
];

export const careServices = [
  { icon: "Video", title: "Telemedicine", text: "See a specialist by secure video, often the same day.", href: "/marketplace" },
  { icon: "House", title: "Home sample collection", text: "A phlebotomist visits you at home, 7 days a week.", href: "/marketplace" },
  { icon: "Truck", title: "Pharmacy delivery", text: "Upload a prescription and get medicines delivered.", href: "/marketplace" },
  { icon: "Ambulance", title: "Ambulance service", text: "Paramedic-staffed ambulances on call 24/7.", href: "/emergency" },
  { icon: "Syringe", title: "Vaccinations", text: "Travel, flu and childhood vaccines without a long wait.", href: "/departments/pediatrics" },
  { icon: "FileSearch", title: "Second opinion", text: "An expert review of your diagnosis and treatment plan.", href: "/doctors" },
  { icon: "HeartHandshake", title: "Home nursing", text: "Wound care, injections and post-surgery visits at home.", href: "/contact" },
  { icon: "Accessibility", title: "Mobility rentals", text: "Rent wheelchairs, walkers and hospital beds by the week.", href: "/marketplace" },
] as const;
