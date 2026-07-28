import { quizQuestions } from '../data/quizQuestions';
import { transliterate } from '../domain/letters';

function normalize(value: string): string {
  return value.trim().replace(/[.!?]+$/u, '').toLocaleLowerCase('sr');
}

const WORD_AUDIO = new Map<string, string>();
for (const question of quizQuestions) {
  WORD_AUDIO.set(normalize(question.word), question.audioSource);
  WORD_AUDIO.set(normalize(transliterate(question.word)), question.audioSource);
}

export function resolveWordAudio(text: string): string | null {
  return WORD_AUDIO.get(normalize(text)) ?? null;
}
