/**
 * Single source of truth for hospital departments. Drives the mega menu,
 * /departments, /departments/[slug], doctor filters and "shop by department".
 * Slugs must match the image file names in public/images/departments/ and
 * public/images/icons/departments/.
 */

export type DepartmentGroupId =
  | "critical-care"
  | "medical"
  | "surgical"
  | "women-child"
  | "specialty"
  | "diagnostics-support";

export type MarketplaceCategoryId =
  | "lab-tests"
  | "health-packages"
  | "pharmacy"
  | "medical-devices"
  | "mobility"
  | "consultations"
  | "wellness"
  | "mother-baby"
  | "personal-care"
  | "first-aid";

export interface Department {
  slug: string;
  name: string;
  group: DepartmentGroupId;
  /** Accent color used for tints, matches the 3D icon accent. */
  accent: string;
  summary: string;
  description: string;
  services: string[];
  conditions: string[];
  marketplaceCategories: MarketplaceCategoryId[];
  location: string;
  hours: string;
  featured?: boolean;
  /** Open 24/7 or takes walk-ins without booking. */
  urgent?: boolean;
}

export const departmentGroups: { id: DepartmentGroupId; name: string; blurb: string }[] = [
  { id: "critical-care", name: "Critical care", blurb: "Round-the-clock emergency and intensive care" },
  { id: "medical", name: "Medical", blurb: "Diagnosis and long-term care for every organ system" },
  { id: "surgical", name: "Surgical", blurb: "Modern operating suites and fast recovery" },
  { id: "women-child", name: "Women & child", blurb: "From pregnancy to the teenage years" },
  { id: "specialty", name: "Specialty", blurb: "Skin, mind, eyes, ears and smiles" },
  { id: "diagnostics-support", name: "Diagnostics & support", blurb: "Imaging, lab, pharmacy and recovery" },
];

const OUTPATIENT = "Mon–Sat, 8:00–18:00";
const ALWAYS = "Open 24/7";

export const departments: Department[] = [
  // Critical care
  {
    slug: "emergency",
    name: "Emergency",
    group: "critical-care",
    accent: "#ef4444",
    summary: "Fast, calm emergency care for adults and children, any hour.",
    description:
      "Our emergency department sees patients 24 hours a day with a dedicated pediatric bay, a rapid stroke and chest pain pathway, and a trauma team on site at all times. Live wait times help you plan, but if it is serious, come straight in or call for an ambulance.",
    services: ["Triage within 10 minutes", "Stroke and chest pain fast track", "Trauma and fracture care", "Pediatric emergency bay", "Ambulance and transfer service", "Observation unit"],
    conditions: ["Chest pain", "Stroke symptoms", "Severe injuries", "Breathing difficulty", "High fever in infants", "Allergic reactions"],
    marketplaceCategories: ["first-aid", "medical-devices"],
    location: "Ground floor, East entrance",
    hours: ALWAYS,
    featured: true,
    urgent: true,
  },
  {
    slug: "icu",
    name: "Intensive Care (ICU)",
    group: "critical-care",
    accent: "#3b82f6",
    summary: "Continuous monitoring and one-to-one nursing for critical patients.",
    description:
      "The ICU has 36 single rooms with advanced monitoring, ventilation and dialysis at the bedside. Intensivists are on site day and night, and families get daily updates and flexible visiting.",
    services: ["Mechanical ventilation", "Bedside dialysis", "Post-surgical intensive care", "Cardiac intensive care", "Family liaison nurse"],
    conditions: ["Sepsis", "Respiratory failure", "Major surgery recovery", "Multi-organ failure", "Severe trauma"],
    marketplaceCategories: ["medical-devices"],
    location: "Level 3, Critical Care Wing",
    hours: ALWAYS,
    urgent: true,
  },
  {
    slug: "anesthesiology",
    name: "Anesthesiology",
    group: "critical-care",
    accent: "#38bdf8",
    summary: "Safe anesthesia and pain control before, during and after surgery.",
    description:
      "Our anesthesiologists plan every procedure with you, from general anesthesia to nerve blocks, and run a dedicated pain clinic for chronic pain that has not responded to other treatment.",
    services: ["Pre-operative assessment", "General and regional anesthesia", "Sedation for procedures", "Chronic pain clinic", "Labor epidurals"],
    conditions: ["Surgical anesthesia", "Chronic back pain", "Nerve pain", "Cancer pain"],
    marketplaceCategories: ["consultations"],
    location: "Level 2, Surgical Suite",
    hours: OUTPATIENT,
  },

  // Medical
  {
    slug: "internal-medicine",
    name: "Internal Medicine",
    group: "medical",
    accent: "#0ea5a4",
    summary: "Your first stop for check-ups, diagnosis and long-term conditions.",
    description:
      "Internists look at the whole picture: one doctor coordinating your tests, specialists and medicines. Ideal for annual check-ups, unexplained symptoms and managing several conditions at once.",
    services: ["Annual health check-up", "Chronic disease management", "Pre-travel consultation", "Second opinions", "Vaccinations for adults"],
    conditions: ["High blood pressure", "High cholesterol", "Fatigue", "Recurring infections", "Anemia"],
    marketplaceCategories: ["health-packages", "lab-tests", "consultations"],
    location: "Level 1, Outpatient Center",
    hours: OUTPATIENT,
    featured: true,
  },
  {
    slug: "cardiology",
    name: "Cardiology",
    group: "medical",
    accent: "#f43f5e",
    summary: "Heart care from first ECG to advanced interventions.",
    description:
      "Our heart center combines non-invasive testing, a 24/7 cath lab and cardiac rehab. Same-week appointments for chest pain, palpitations and high blood pressure.",
    services: ["ECG and echocardiography", "Stress testing", "Holter monitoring", "Cardiac catheterization", "Pacemaker clinic", "Cardiac rehabilitation"],
    conditions: ["Coronary artery disease", "Heart failure", "Arrhythmia", "High blood pressure", "Valve disease"],
    marketplaceCategories: ["health-packages", "medical-devices", "lab-tests"],
    location: "Level 2, Heart Center",
    hours: OUTPATIENT,
    featured: true,
  },
  {
    slug: "neurology",
    name: "Neurology",
    group: "medical",
    accent: "#8b5cf6",
    summary: "Brain, spine and nerve care, including a rapid stroke unit.",
    description:
      "Neurologists diagnose and treat headaches, epilepsy, movement disorders and memory problems, with EEG, EMG and 3T MRI on site and a stroke unit linked to the emergency department.",
    services: ["Stroke unit", "EEG and EMG", "Headache and migraine clinic", "Epilepsy monitoring", "Memory clinic"],
    conditions: ["Stroke", "Migraine", "Epilepsy", "Parkinson's disease", "Multiple sclerosis", "Dementia"],
    marketplaceCategories: ["consultations", "wellness"],
    location: "Level 4, Neuroscience Center",
    hours: OUTPATIENT,
    featured: true,
  },
  {
    slug: "pulmonology",
    name: "Pulmonology",
    group: "medical",
    accent: "#06b6d4",
    summary: "Breathing tests, asthma care and sleep studies.",
    description:
      "From lung function tests to bronchoscopy and overnight sleep studies, our respiratory team helps you breathe easier at every stage of life.",
    services: ["Lung function testing", "Bronchoscopy", "Asthma and COPD clinic", "Sleep studies", "Pulmonary rehab"],
    conditions: ["Asthma", "COPD", "Sleep apnea", "Chronic cough", "Pneumonia"],
    marketplaceCategories: ["medical-devices", "pharmacy"],
    location: "Level 4, East Wing",
    hours: OUTPATIENT,
  },
  {
    slug: "gastroenterology",
    name: "Gastroenterology",
    group: "medical",
    accent: "#f59e0b",
    summary: "Digestive health, endoscopy and liver care.",
    description:
      "Our endoscopy suite offers comfortable, sedated procedures with same-day results. Specialists treat everything from reflux to inflammatory bowel disease and liver conditions.",
    services: ["Endoscopy and colonoscopy", "Liver clinic", "IBD clinic", "Reflux testing", "Nutrition support"],
    conditions: ["Acid reflux", "Irritable bowel syndrome", "Crohn's disease", "Fatty liver", "Gallstones"],
    marketplaceCategories: ["lab-tests", "pharmacy", "wellness"],
    location: "Level 3, West Wing",
    hours: OUTPATIENT,
  },
  {
    slug: "nephrology",
    name: "Nephrology",
    group: "medical",
    accent: "#dc2626",
    summary: "Kidney care and a comfortable modern dialysis unit.",
    description:
      "We look after kidney health from early disease to dialysis and transplant preparation, with evening dialysis sessions so treatment fits around your life.",
    services: ["Kidney function testing", "Hemodialysis", "Home dialysis training", "Transplant assessment", "Kidney stone prevention"],
    conditions: ["Chronic kidney disease", "Kidney stones", "Glomerulonephritis", "High blood pressure"],
    marketplaceCategories: ["lab-tests", "medical-devices"],
    location: "Level 1, Dialysis Unit",
    hours: "Mon–Sat, 6:00–22:00",
  },
  {
    slug: "endocrinology",
    name: "Endocrinology",
    group: "medical",
    accent: "#84cc16",
    summary: "Diabetes, thyroid and hormone care.",
    description:
      "Endocrinologists, diabetes educators and dietitians work together, with continuous glucose monitoring and insulin pump starts available in clinic.",
    services: ["Diabetes clinic", "Thyroid clinic", "Insulin pump starts", "Continuous glucose monitoring", "Osteoporosis care"],
    conditions: ["Type 1 and type 2 diabetes", "Thyroid disorders", "PCOS", "Osteoporosis", "Obesity"],
    marketplaceCategories: ["lab-tests", "medical-devices", "health-packages"],
    location: "Level 1, Outpatient Center",
    hours: OUTPATIENT,
  },
  {
    slug: "oncology",
    name: "Oncology",
    group: "medical",
    accent: "#a78bfa",
    summary: "Personal cancer care with a team that walks with you.",
    description:
      "Each patient gets a named nurse navigator and a tumor board plan. Our day unit offers chemotherapy, immunotherapy and supportive care in a calm, sunlit space.",
    services: ["Tumor board review", "Chemotherapy and immunotherapy", "Radiation therapy", "Genetic counseling", "Supportive and palliative care"],
    conditions: ["Breast cancer", "Lung cancer", "Colorectal cancer", "Lymphoma", "Prostate cancer"],
    marketplaceCategories: ["wellness", "personal-care", "consultations"],
    location: "Level 5, Cancer Center",
    hours: OUTPATIENT,
    featured: true,
  },

  // Surgical
  {
    slug: "general-surgery",
    name: "General Surgery",
    group: "surgical",
    accent: "#64748b",
    summary: "Keyhole and robotic surgery with faster recovery.",
    description:
      "Most of our procedures are minimally invasive, many as day surgery. An enhanced recovery program gets you home sooner with less pain.",
    services: ["Laparoscopic surgery", "Robotic surgery", "Hernia repair", "Gallbladder surgery", "Day surgery unit"],
    conditions: ["Hernia", "Gallstones", "Appendicitis", "Thyroid nodules", "Bowel conditions"],
    marketplaceCategories: ["first-aid", "mobility"],
    location: "Level 2, Surgical Suite",
    hours: OUTPATIENT,
  },
  {
    slug: "orthopedics",
    name: "Orthopedics",
    group: "surgical",
    accent: "#f97316",
    summary: "Bones, joints and sports injuries, from braces to joint replacement.",
    description:
      "Sports medicine, joint replacement and spine care under one roof, with physiotherapy starting the day after surgery and rental mobility aids for your recovery at home.",
    services: ["Sports injury clinic", "Hip and knee replacement", "Arthroscopy", "Fracture clinic", "Spine care"],
    conditions: ["Osteoarthritis", "Ligament tears", "Fractures", "Back pain", "Frozen shoulder"],
    marketplaceCategories: ["mobility", "medical-devices", "consultations"],
    location: "Level 2, West Wing",
    hours: OUTPATIENT,
    featured: true,
  },
  {
    slug: "neurosurgery",
    name: "Neurosurgery",
    group: "surgical",
    accent: "#9333ea",
    summary: "Precision brain and spine surgery with image guidance.",
    description:
      "Neurosurgeons use navigation, intraoperative imaging and microsurgery for conditions of the brain, spine and nerves, working hand in hand with neurology and rehab.",
    services: ["Brain tumor surgery", "Minimally invasive spine surgery", "Neuronavigation", "Nerve decompression"],
    conditions: ["Brain tumors", "Herniated disc", "Spinal stenosis", "Hydrocephalus"],
    marketplaceCategories: ["mobility", "consultations"],
    location: "Level 4, Neuroscience Center",
    hours: OUTPATIENT,
  },
  {
    slug: "urology",
    name: "Urology",
    group: "surgical",
    accent: "#6366f1",
    summary: "Kidney, bladder and men's health with discreet care.",
    description:
      "From kidney stones to prostate care, our urologists offer laser treatments and same-day procedures in a private, comfortable clinic.",
    services: ["Laser stone treatment", "Prostate clinic", "Bladder function tests", "Vasectomy", "Men's health check"],
    conditions: ["Kidney stones", "Enlarged prostate", "Urinary incontinence", "UTIs"],
    marketplaceCategories: ["lab-tests", "personal-care"],
    location: "Level 3, West Wing",
    hours: OUTPATIENT,
  },
  {
    slug: "plastic-surgery",
    name: "Plastic Surgery",
    group: "surgical",
    accent: "#fb923c",
    summary: "Reconstructive and aesthetic surgery with natural results.",
    description:
      "Reconstruction after injury or cancer, hand surgery and aesthetic procedures, each starting with an unhurried consultation and a clear plan.",
    services: ["Reconstructive surgery", "Hand surgery", "Scar revision", "Aesthetic consultation", "Burn care"],
    conditions: ["Post-cancer reconstruction", "Burns", "Scars", "Hand injuries"],
    marketplaceCategories: ["personal-care", "consultations"],
    location: "Level 6, Private Suites",
    hours: OUTPATIENT,
  },

  // Women & child
  {
    slug: "obstetrics-gynecology",
    name: "Obstetrics & Gynecology",
    group: "women-child",
    accent: "#ec4899",
    summary: "Pregnancy, birth and women's health at every age.",
    description:
      "Private birthing suites, a midwife-led unit and a level III neonatal unit next door. Our gynecologists also care for fertility, menopause and minimally invasive surgery.",
    services: ["Antenatal care", "Birthing suites", "Fertility clinic", "Menopause clinic", "Minimally invasive gynecology"],
    conditions: ["Pregnancy", "Endometriosis", "Fibroids", "PCOS", "Menopause symptoms"],
    marketplaceCategories: ["mother-baby", "health-packages", "lab-tests"],
    location: "Level 3, Women's Center",
    hours: ALWAYS,
    featured: true,
  },
  {
    slug: "pediatrics",
    name: "Pediatrics",
    group: "women-child",
    accent: "#eab308",
    summary: "Gentle care for babies, kids and teens.",
    description:
      "Child-friendly rooms, play specialists and pediatricians for every stage, from newborn checks and vaccines to teenage health.",
    services: ["Well-child visits", "Vaccinations", "Pediatric allergy clinic", "Child development", "Pediatric ward"],
    conditions: ["Asthma in children", "Allergies", "Ear infections", "Growth concerns", "Fever"],
    marketplaceCategories: ["mother-baby", "first-aid", "health-packages"],
    location: "Level 2, Children's Wing",
    hours: OUTPATIENT,
    featured: true,
  },
  {
    slug: "neonatology",
    name: "Neonatology",
    group: "women-child",
    accent: "#7dd3fc",
    summary: "Level III neonatal intensive care for the smallest patients.",
    description:
      "Our NICU cares for premature and unwell newborns with family rooms so parents can stay close, plus lactation support and follow-up clinics after going home.",
    services: ["Neonatal intensive care", "Family rooms", "Lactation support", "Developmental follow-up"],
    conditions: ["Prematurity", "Newborn jaundice", "Breathing problems at birth", "Low birth weight"],
    marketplaceCategories: ["mother-baby"],
    location: "Level 3, Women's Center",
    hours: ALWAYS,
    urgent: true,
  },

  // Specialty
  {
    slug: "dermatology",
    name: "Dermatology",
    group: "specialty",
    accent: "#d4a373",
    summary: "Skin, hair and nail care, plus skin cancer checks.",
    description:
      "Medical and cosmetic dermatology with digital mole mapping, phototherapy and a same-week rash clinic.",
    services: ["Mole mapping", "Skin cancer screening", "Phototherapy", "Acne clinic", "Minor skin surgery"],
    conditions: ["Eczema", "Psoriasis", "Acne", "Skin cancer", "Hair loss"],
    marketplaceCategories: ["personal-care", "pharmacy"],
    location: "Level 1, Outpatient Center",
    hours: OUTPATIENT,
  },
  {
    slug: "psychiatry",
    name: "Psychiatry",
    group: "specialty",
    accent: "#a855f7",
    summary: "Mental health care that is private, kind and practical.",
    description:
      "Psychiatrists and psychologists offer assessment, therapy and medicine management, in person or by secure video, with a short wait for first appointments.",
    services: ["Psychiatric assessment", "Talking therapies", "Medication management", "Video consultations", "Crisis support line"],
    conditions: ["Depression", "Anxiety", "ADHD", "Bipolar disorder", "Insomnia"],
    marketplaceCategories: ["consultations", "wellness"],
    location: "Level 6, Wellbeing Center",
    hours: OUTPATIENT,
  },
  {
    slug: "ophthalmology",
    name: "Ophthalmology",
    group: "specialty",
    accent: "#2563eb",
    summary: "Eye exams, cataract surgery and retina care.",
    description:
      "From routine eye exams to same-day cataract surgery and retina injections, our eye center uses the latest imaging to protect your sight.",
    services: ["Comprehensive eye exams", "Cataract surgery", "Glaucoma clinic", "Retina clinic", "Pediatric eye care"],
    conditions: ["Cataracts", "Glaucoma", "Macular degeneration", "Diabetic eye disease", "Dry eye"],
    marketplaceCategories: ["personal-care", "consultations"],
    location: "Level 1, Eye Center",
    hours: OUTPATIENT,
  },
  {
    slug: "ent",
    name: "ENT (Ear, Nose & Throat)",
    group: "specialty",
    accent: "#10b981",
    summary: "Hearing, sinus, voice and sleep-related breathing care.",
    description:
      "ENT surgeons and audiologists treat hearing loss, sinus problems, tonsils and voice disorders, with hearing tests the same day.",
    services: ["Hearing tests", "Sinus surgery", "Tonsil and adenoid care", "Voice clinic", "Snoring assessment"],
    conditions: ["Hearing loss", "Sinusitis", "Tonsillitis", "Tinnitus", "Vertigo"],
    marketplaceCategories: ["medical-devices", "pharmacy"],
    location: "Level 1, Outpatient Center",
    hours: OUTPATIENT,
  },
  {
    slug: "dentistry",
    name: "Dentistry",
    group: "specialty",
    accent: "#34d399",
    summary: "Modern dental care for the whole family.",
    description:
      "General, cosmetic and surgical dentistry with digital X-rays, same-day emergency slots and gentle sedation for anxious patients.",
    services: ["Check-ups and cleaning", "Fillings and root canals", "Implants", "Orthodontics", "Emergency dental care"],
    conditions: ["Tooth decay", "Gum disease", "Missing teeth", "Misaligned teeth", "Tooth pain"],
    marketplaceCategories: ["personal-care"],
    location: "Ground floor, Dental Clinic",
    hours: OUTPATIENT,
  },

  // Diagnostics & support
  {
    slug: "radiology",
    name: "Radiology",
    group: "diagnostics-support",
    accent: "#64748b",
    summary: "MRI, CT, ultrasound and X-ray with fast reporting.",
    description:
      "3T MRI, low-dose CT, ultrasound, mammography and interventional radiology. Most reports are ready within 24 hours in your patient portal.",
    services: ["MRI", "CT scan", "Ultrasound", "Digital X-ray", "Mammography", "Interventional radiology"],
    conditions: ["Injury imaging", "Cancer staging", "Breast screening", "Abdominal pain"],
    marketplaceCategories: ["health-packages", "lab-tests"],
    location: "Ground floor, Imaging Center",
    hours: ALWAYS,
  },
  {
    slug: "pathology-lab",
    name: "Pathology & Lab",
    group: "diagnostics-support",
    accent: "#22c55e",
    summary: "Accredited lab with home sample collection.",
    description:
      "Our accredited lab runs more than 1,200 tests, with results in your portal and home sample collection across the city.",
    services: ["Blood tests", "Home sample collection", "Histopathology", "Microbiology", "Genetic testing"],
    conditions: ["Routine screening", "Infections", "Hormone levels", "Vitamin deficiency"],
    marketplaceCategories: ["lab-tests", "health-packages"],
    location: "Ground floor, Lab Services",
    hours: "Daily, 6:00–22:00",
  },
  {
    slug: "pharmacy",
    name: "Pharmacy",
    group: "diagnostics-support",
    accent: "#0ea5a4",
    summary: "Hospital pharmacy with prescription delivery.",
    description:
      "Pharmacists check every prescription and can deliver to your door. Upload a prescription in the marketplace and pick up in 2 hours or get it delivered the same day.",
    services: ["Prescription filling", "Home delivery", "Medicine reviews", "Vaccinations", "Compounding"],
    conditions: ["Medicine questions", "Repeat prescriptions", "Drug interactions"],
    marketplaceCategories: ["pharmacy", "first-aid", "personal-care", "wellness"],
    location: "Ground floor, Main lobby",
    hours: ALWAYS,
  },
  {
    slug: "physiotherapy",
    name: "Physiotherapy & Rehab",
    group: "diagnostics-support",
    accent: "#f97316",
    summary: "Get moving again after injury, surgery or stroke.",
    description:
      "Physiotherapists, occupational therapists and speech therapists in a bright rehab gym, with home exercise plans and equipment you can rent.",
    services: ["Sports physiotherapy", "Post-surgery rehab", "Stroke rehab", "Hydrotherapy", "Occupational therapy"],
    conditions: ["Back and neck pain", "Sports injuries", "Joint replacement recovery", "Stroke recovery"],
    marketplaceCategories: ["mobility", "medical-devices", "wellness"],
    location: "Level 1, Rehab Gym",
    hours: "Mon–Sat, 7:00–20:00",
  },
  {
    slug: "nutrition",
    name: "Nutrition & Dietetics",
    group: "diagnostics-support",
    accent: "#16a34a",
    summary: "Practical food plans for health conditions and goals.",
    description:
      "Registered dietitians build realistic plans for diabetes, heart health, weight, pregnancy and digestive conditions, in clinic or online.",
    services: ["Diet consultations", "Weight management", "Diabetes nutrition", "Sports nutrition", "Online follow-ups"],
    conditions: ["Diabetes", "High cholesterol", "Weight concerns", "Food intolerances"],
    marketplaceCategories: ["wellness", "consultations"],
    location: "Level 1, Outpatient Center",
    hours: OUTPATIENT,
  },
];

export const departmentsBySlug = Object.fromEntries(departments.map((d) => [d.slug, d])) as Record<
  string,
  Department
>;

export function getDepartment(slug: string) {
  return departmentsBySlug[slug];
}

export function departmentsInGroup(group: DepartmentGroupId) {
  return departments.filter((d) => d.group === group);
}

export const departmentImage = (slug: string) => `/images/departments/${slug}.png`;
export const departmentIcon = (slug: string) => `/images/icons/departments/${slug}.png`;
