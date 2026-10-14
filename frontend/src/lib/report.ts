/** The kinds of problem a reader can report on a lesson, shared by the form and /api/report. */
export const REPORT_KINDS = {
  mistake: 'A mistake in the notes or worked example',
  answer: 'A wrong answer or hint in the practice',
  level: 'Pitched at the wrong level',
  broken: 'Something on the page does not work',
  other: 'Something else',
} as const;

export type ReportKind = keyof typeof REPORT_KINDS;
