/* eslint-disable no-console */
import type { Role } from '@/types/llm';

export function audienceIntro(role: Role): string {
  switch (role) {
    case 'explorer': return 'For ages 8–12: short, friendly sentences.';
    case 'cadet':    return 'For teens: clear, energetic; brief explanations for any technical terms.';
    case 'scholar':  return 'For undergrads: concise, precise language and correct terminology.';
    default:         return 'For a general audience: clear and concise.';
  }
}

/**
 * Build the Rocket Lab topic-generation prompt.
 * Accepts an optional role to tailor writing guidance.
 */
export function buildRocketLabTopicPrompt(role?: Role): string {
  const style = role ? audienceIntro(role) : 'For a general audience: clear and concise.';
  return [
    'Return ONLY a JSON array of 3–5 topic objects in this exact schema:',
    '[',
    '  { "title": "Topic Title", "summary": "1–2 sentences", "keywords": ["k1","k2"], "searchQueries": ["q1","q2"] }',
    ']',
    '',
    'Guidelines:',
    '- Topics: rocket components, orbital mechanics, or launch procedures.',
    `- Style: ${style}`,
    '- Avoid duplicate topics; keep titles specific (e.g., “Gimbal Control in First Stage” rather than “Rocket Control”).',
    '- Keep each summary <= 2 sentences; keywords/searchQueries should be relevant and concrete.',
  ].join('\n');
}

/**
 * Back-compat alias so existing imports keep working.
 * Also accepts an optional role (so calls like rocketLabTopicPrompt(role) compile).
 */
export function rocketLabTopicPrompt(role?: Role): string {
  return buildRocketLabTopicPrompt(role);
}
