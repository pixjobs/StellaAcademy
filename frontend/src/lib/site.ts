export const SITE_URL = 'https://www.stella-academy.org';
export const SITE_NAME = 'Stella Academy';
export const SITE_DESCRIPTION =
  'Free interactive physics and maths lessons for ages 9 to 18 and beyond, from key stage 2 to GCSE and A-level, matched to the national curriculum. Each has a model to experiment with, a worked example and practice questions with answers.';

/**
 * Where "Support Stella" sends people: the Ko-fi page. Override with
 * NEXT_PUBLIC_SUPPORT_URL. If this is ever empty, every support button and
 * prompt is hidden.
 */
export const SUPPORT_URL = process.env.NEXT_PUBLIC_SUPPORT_URL || 'https://ko-fi.com/P6I428NJUJ';
export const supportEnabled = Boolean(SUPPORT_URL);

/** Google Analytics 4 measurement ID (public by design). Override with NEXT_PUBLIC_GA_ID. */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-2WZE7ZQE3C';

/** When the lessons were last revised; shown to search engines in the sitemap. Update it when content changes. */
export const CONTENT_UPDATED = '2026-10-14';
