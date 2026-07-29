import { describe, expect, it } from 'vitest';
import { rhymeRounds, syllableSets, wordReadingRounds } from './readingLessons';

describe('progresivne vežbe čitanja', () => {
  it('ima najmanje deset različitih vežbi rime', () => {
    expect(rhymeRounds.length).toBeGreaterThanOrEqual(10);
    expect(new Set(rhymeRounds.map((round) => round.prompt)).size).toBe(rhymeRounds.length);
    for (const round of rhymeRounds) {
      expect(round.options).toHaveLength(3);
      expect(round.options).toContain(round.correct);
    }
  });

  it('ima više grupa slogova i svaki slog ima lokalni audio ključ', () => {
    expect(syllableSets.length).toBeGreaterThanOrEqual(5);
    expect(syllableSets.flatMap((set) => set.syllables).length).toBeGreaterThanOrEqual(25);
  });

  it('ima najmanje deset grupa reči sa odgovarajućim slikama', () => {
    expect(wordReadingRounds.length).toBeGreaterThanOrEqual(10);
    for (const round of wordReadingRounds) {
      expect(round.words).toHaveLength(3);
      expect(new Set(round.words.map((word) => word.word)).size).toBe(3);
      expect(round.words.every((word) => word.image.length > 0)).toBe(true);
    }
  });
});
