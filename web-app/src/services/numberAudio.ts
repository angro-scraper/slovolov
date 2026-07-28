import { numberLessons } from '../data/numbers';
import { transliterate } from '../domain/letters';

function normalize(value: string): string {
  return value.trim().replace(/[.!?]+$/u, '').toLocaleLowerCase('sr');
}

const NUMBER_AUDIO = new Map<string, string>();
for (const lesson of numberLessons) {
  const source = `/audio/numbers/${String(lesson.value).padStart(3, '0')}.mp3`;
  NUMBER_AUDIO.set(normalize(lesson.word), source);
  NUMBER_AUDIO.set(normalize(transliterate(lesson.word)), source);
}

export function resolveNumberAudio(text: string): string | null {
  return NUMBER_AUDIO.get(normalize(text)) ?? null;
}
