export const SITE_URL = 'https://www.stella-academy.org';
export const SITE_NAME = 'Stella Academy';
export const SITE_DESCRIPTION =
  'Free interactive physics and maths lessons for ages 9 to 18 and beyond, from number foundations to GCSE and A-level. Each has a model to experiment with, a worked example and practice questions with answers.';

/**
 * Where "Support Stella" sends people (a payment or donation link).
 * While this is empty every support button and prompt stays hidden.
 */
export const SUPPORT_URL = process.env.NEXT_PUBLIC_SUPPORT_URL || '';
export const supportEnabled = Boolean(SUPPORT_URL);

/** Google Analytics 4 measurement ID (public by design). Override with NEXT_PUBLIC_GA_ID. */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-2WZE7ZQE3C';
