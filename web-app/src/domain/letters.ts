import rawLetters from '../data/letters.json';

export type LetterWord = { word: string; emoji: string; image?: string };
export type Letter = {
  upper: string;
  lower: string;
  words: LetterWord[];
  color: string;
};

export const CYRILLIC_ALPHABET = 'АБВГДЂЕЖЗИЈКЛЉМНЊОПРСТЋУФХЦЧЏШ';
export const LATIN_ALPHABET = [
  'A', 'B', 'V', 'G', 'D', 'Đ', 'E', 'Ž', 'Z', 'I', 'J', 'K', 'L', 'Lj',
  'M', 'N', 'Nj', 'O', 'P', 'R', 'S', 'T', 'Ć', 'U', 'F', 'H', 'C', 'Č', 'Dž', 'Š'
];

export const letters = rawLetters as Letter[];

const pairs = new Map<string, string>();
for (let index = 0; index < letters.length; index += 1) {
  pairs.set(letters[index].upper, LATIN_ALPHABET[index].toUpperCase());
  pairs.set(letters[index].lower, LATIN_ALPHABET[index].toLowerCase());
}

export function transliterate(value: string): string {
  return [...value].map((character) => pairs.get(character) ?? character).join('');
}

export function displayLetter(letter: Letter, script: 'cyrillic' | 'latin'): string {
  const index = letters.indexOf(letter);
  return script === 'cyrillic' ? letter.upper : LATIN_ALPHABET[index];
}
