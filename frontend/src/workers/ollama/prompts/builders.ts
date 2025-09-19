import type { Role } from '@/types/llm';
import { audienceSpec } from './audience';
import { templates } from './templates';

export function buildRocketLabTopicPrompt(
  role: Role,
  variety: { lens: string; output: string; challenge: string },
  contextLines: string[],
): string {
  const aud = audienceSpec(role);
  return templates.rocketLabTopics(aud, variety, contextLines);
}

export function hardenAskPrompt(question: string, extra?: string): string {
  return `${templates.askSystem('Be direct; cite units when relevant.')}\n\nUSER:\n${templates.askUser(question, extra)}\n\nReturn plain text.`;
}

export function buildTutorSystem(role: Role, mission: string, topicTitle: string, imageTitle?: string): string {
  const aud = audienceSpec(role);
  return templates.tutorSystem({
    roleLabel: role,
    mission,
    topicTitle,
    imageTitle,
    audNote: `${aud.promptNote} Be encouraging and succinct.`,
  });
}

export function buildTutorUser(topicSummary: string): string {
  return templates.tutorUser(topicSummary);
}

export function audienceIntroLine(role: Role): string {
  return audienceSpec(role).introNote;
}
