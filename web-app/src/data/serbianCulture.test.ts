import { describe, expect, it } from 'vitest';
import { cultureCards } from './serbianCulture';

describe('srpska kultura za dijasporu', () => {
  it('pokriva šest obrazovnih oblasti i oba pisma', () => {
    expect(new Set(cultureCards.map((card) => card.category)).size).toBeGreaterThanOrEqual(6);
    expect(cultureCards.length).toBeGreaterThanOrEqual(18);
    expect(cultureCards.every((card) => card.titleCyrillic && card.titleLatin && card.fact.length > 25)).toBe(true);
  });
});
