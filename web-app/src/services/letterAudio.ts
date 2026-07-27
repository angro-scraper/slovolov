import { LATIN_ALPHABET, letters } from '../domain/letters';

export type LetterAudioKind = 'sound' | 'example';

export interface LetterAudioMatch {
  index: number;
  kind: LetterAudioKind;
  source: string;
}

function normalize(value: string): string {
  return value.trim().replace(/[.!?]+$/u, '').toLocaleLowerCase('sr');
}

const letterTokens = letters.flatMap((letter, index) => {
  const latin = LATIN_ALPHABET[index];
  return [
    { value: letter.upper, index },
    { value: letter.lower, index },
    { value: latin, index },
    { value: latin.toLocaleLowerCase('sr'), index }
  ];
});

export function resolveLetterAudio(text: string): LetterAudioMatch | undefined {
  const normalized = normalize(text);
  const exact = letterTokens.find(({ value }) => normalize(value) === normalized);
  if (exact) {
    return {
      index: exact.index,
      kind: 'sound',
      source: `/audio/letters/${String(exact.index + 1).padStart(2, '0')}-sound.mp3`
    };
  }

  const example = letterTokens.find(({ value }) => {
    const token = normalize(value);
    return [
      `${token} kao `,
      `${token}, kao `,
      `${token} као `,
      `${token}, као `
    ].some((prefix) => normalized.startsWith(prefix));
  });
  if (!example) return undefined;

  return {
    index: example.index,
    kind: 'example',
    source: `/audio/letters/${String(example.index + 1).padStart(2, '0')}-example.mp3`
  };
}
