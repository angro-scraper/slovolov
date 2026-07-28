import { letters } from '../domain/letters';
import { versionAudioUrl } from '../services/audioAssets';

export type QuizQuestion = {
  id: string;
  letterIndex: number;
  word: string;
  emoji: string;
  audioSource: string;
};

export const quizQuestions: QuizQuestion[] = letters.flatMap((letter, letterIndex) =>
  letter.words.map((entry, wordIndex) => {
    const number = String(letterIndex * 3 + wordIndex + 1).padStart(2, '0');
    return {
      id: `${letter.upper}-${wordIndex + 1}`,
      letterIndex,
      word: entry.word,
      emoji: entry.emoji,
      audioSource: versionAudioUrl(`/audio/quiz/${number}.mp3`)
    };
  })
);

function nextRandom(state: number): number {
  let value = state + 0x6D2B79F5;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return (value ^ (value >>> 14)) >>> 0;
}

export function createQuizRound(seed: number, count = 10): QuizQuestion[] {
  const shuffled = [...quizQuestions];
  let state = seed >>> 0;
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    state = nextRandom(state);
    const target = state % (index + 1);
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
