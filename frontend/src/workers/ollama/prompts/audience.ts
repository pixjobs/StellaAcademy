import type { Role } from '@/types/llm';

export type AudienceSpec = { level: string; promptNote: string; introNote: string };

export function audienceSpec(role: Role): AudienceSpec {
  // Shared generic prompt note — always produces technical, NASA-compatible topics
  const genericPrompt = 'Use clear, factual language with correct NASA/space terminology.';

  switch (role) {
    case 'explorer':
      return {
        level: 'kids (8–12)',
        promptNote: genericPrompt,
        introNote: 'Written with younger explorers in mind (but still technically correct).',
      };
    case 'cadet':
      return {
        level: 'teens',
        promptNote: genericPrompt,
        introNote: 'Framed for cadets and learners starting their journey.',
      };
    case 'scholar':
      return {
        level: 'undergrad',
        promptNote: genericPrompt,
        introNote: 'Suited to scholars looking for deeper insights.',
      };
    default:
      return {
        level: 'general audience',
        promptNote: genericPrompt,
        introNote: 'For a broad general audience.',
      };
  }
}
