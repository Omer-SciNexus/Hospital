/**
 * Settings for the "Find my department" chatbot.
 * The bot may only send patients to these departments. Everything else in
 * departments.ts is reached through a doctor (ICU, Neurosurgery, Radiology…)
 * or through the emergency screen.
 */
export const TRIAGE_DEPARTMENTS = [
  "internal-medicine",
  "cardiology",
  "neurology",
  "pulmonology",
  "gastroenterology",
  "nephrology",
  "endocrinology",
  "oncology",
  "general-surgery",
  "orthopedics",
  "urology",
  "plastic-surgery",
  "obstetrics-gynecology",
  "pediatrics",
  "dermatology",
  "psychiatry",
  "ophthalmology",
  "ent",
  "dentistry",
  "physiotherapy",
  "nutrition",
] as const;

export type TriageDepartment = (typeof TRIAGE_DEPARTMENTS)[number];

export const TRIAGE_OPENING_QUESTION = "Where does it hurt, or what is causing you discomfort?";

/** Longest single patient message. */
export const TRIAGE_MAX_MESSAGE_LENGTH = 1000;
/** After this many patient messages the bot stops and offers the phone number. */
export const TRIAGE_MAX_PATIENT_TURNS = 14;
/** The prompt asks for at most this many follow-up questions. */
export const TRIAGE_MAX_QUESTIONS = 8;
