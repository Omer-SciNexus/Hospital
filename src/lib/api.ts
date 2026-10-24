/**
 * Mock API. Every call resolves in the browser after a short fake delay so
 * loading states are visible. Swap these bodies for real fetch calls (or MSW
 * handlers) later without touching the components that use the hooks.
 */

const wait = (ms = 450) => new Promise((r) => setTimeout(r, ms + Math.random() * 250));

export interface ErStatus {
  waitMinutes: number;
  patientsWaiting: number;
  bedsAvailable: number;
  updatedAt: string;
}

export async function getErStatus(): Promise<ErStatus> {
  await wait();
  const minute = new Date().getMinutes();
  return {
    waitMinutes: 12 + ((minute * 7) % 24),
    patientsWaiting: 4 + (minute % 9),
    bedsAvailable: 3 + (minute % 6),
    updatedAt: new Date().toISOString(),
  };
}

export const queryKeys = {
  erStatus: ["er-status"] as const,
};
