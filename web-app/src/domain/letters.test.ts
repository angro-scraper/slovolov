import { describe, expect, it } from 'vitest';
import { CYRILLIC_ALPHABET, LATIN_ALPHABET, letters, transliterate } from './letters';

describe('katalog srpskih slova', () => {
  it('sadrži tačno 30 slova azbuke ispravnim redom', () => {
    expect(letters).toHaveLength(30);
    expect(letters.map((letter) => letter.upper).join('')).toBe(CYRILLIC_ALPHABET);
  });

  it('ima odgovarajuću latinicu i tri ćirilične reči po slovu', () => {
    expect(LATIN_ALPHABET).toHaveLength(30);
    for (const letter of letters) {
      expect(letter.words).toHaveLength(3);
      expect(letter.words.every(({ word }) => !/[A-Za-z]/.test(word))).toBe(true);
    }
    expect(transliterate('ЉУБАВ')).toBe('LJUBAV');
  });
});
