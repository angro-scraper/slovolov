import { describe, expect, it } from 'vitest';
import { numberLessons } from './numbers';

describe('lekcije brojeva', () => {
  it('pokrivaju svaki broj od nule do sto bez rupa', () => {
    expect(numberLessons).toHaveLength(101);
    expect(numberLessons.map((lesson) => lesson.value)).toEqual(
      Array.from({ length: 101 }, (_, value) => value)
    );
  });

  it('imaju srpski naziv i sliku za svaki broj', () => {
    expect(numberLessons[0].word).toBe('нула');
    expect(numberLessons[21].word).toBe('двадесет један');
    expect(numberLessons[100].word).toBe('сто');
    expect(numberLessons.every((lesson) => lesson.emoji.length > 0)).toBe(true);
  });
});
