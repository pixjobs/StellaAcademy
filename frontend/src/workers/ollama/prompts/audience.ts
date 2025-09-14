import type { Role } from '@/types/llm';

export type AudienceSpec = { level: string; promptNote: string; introNote: string };

export function audienceSpec(role: Role): AudienceSpec {
  switch (role) {
    case 'explorer':
      return {
        level: 'kids (8–12)',
        promptNote: 'Write at a Year 4–6 reading level. Short sentences. Friendly tone.',
        introNote: 'Written for younger explorers.',
      };
    case 'cadet':
      return {
        level: 'teens',
        promptNote: 'Write for motivated teens. Clear, energetic tone. Light jargon with brief explanations.',
        introNote: 'Geared to cadets.',
      };
    case 'scholar':
      return {
        level: 'undergrad',
        promptNote: 'Use concise, precise language with correct terminology.',
        introNote: 'Uses proper terminology and encourages deeper analysis.',
      };
    default:
      return {
        level: 'general audience',
        promptNote: 'Clear, concise, and engaging.',
        introNote: 'For a general audience.',
      };
  }
}
