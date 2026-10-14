/** The kinds of problem a reader can report on a lesson, shared by the form and /api/report. */
export const REPORT_KINDS = {
  mistake: 'A mistake in the notes or worked example',
  answer: 'A wrong answer or hint in the practice',
  level: 'Pitched at the wrong level',
  broken: 'Something on the page does not work',
  other: 'Something else',
} as const;

export type ReportKind = keyof typeof REPORT_KINDS;

/** How long problem reports are kept (the Cloud Logging retention period). Shown to readers. */
export const REPORT_RETENTION_DAYS = 30;

const EMAIL = /[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]{2,}/g;
// Nine or more digits, allowing spaces, dots, dashes and brackets between them, with an optional leading +:
// long enough for any UK phone number, longer than any number used in the lessons.
const PHONE = /\+?\d(?:[\s().-]*\d){8,}/g;

/**
 * Removes email addresses and phone numbers from report text before it is
 * stored. The form asks readers not to include personal details; this catches
 * the most likely ones when they do.
 */
export function redactReport(text: string): string {
  return text.replace(EMAIL, '[email removed]').replace(PHONE, '[number removed]');
}
