/** "Help test Stella" sign-ups, shared by the form on /help, /api/volunteer and the weekly digest. */
export const VOLUNTEER_ROLES = {
  teacher: 'Teacher',
  scientist: 'Scientist or researcher',
  parent: 'Parent or carer',
  other: 'Something else',
} as const;

export type VolunteerRole = keyof typeof VOLUNTEER_ROLES;

/** How long a sign-up is kept (Firestore deletes it through a TTL policy on `expireAt`). Shown to visitors. */
export const VOLUNTEER_RETENTION_MONTHS = 12;

/** A person takes longer than this to fill the form in; a bot posting it straight away does not. */
export const MIN_FILL_MS = 3_000;

export const VOLUNTEER_COLLECTION = 'volunteers';

export const VOLUNTEER_LIMITS = { name: 100, email: 200, subject: 100, note: 1_000 } as const;

const EMAIL = /^[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]{2,}$/;

export function isEmail(value: string): boolean {
  return EMAIL.test(value);
}
