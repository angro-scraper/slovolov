import { describe, expect, it } from 'vitest';
import {
  FREE_LETTER_COUNT,
  FREE_NUMBER_MAX,
  FREE_STORY_COUNT,
  canAccessLetter,
  canAccessNumber,
  canAccessStory
} from './access';

describe('Slovolov Family granice', () => {
  it('ostavlja prvih 10 slova besplatnim, a ostala otključava kupovina', () => {
    expect(FREE_LETTER_COUNT).toBe(10);
    expect(canAccessLetter(9, false)).toBe(true);
    expect(canAccessLetter(10, false)).toBe(false);
    expect(canAccessLetter(29, true)).toBe(true);
  });

  it('besplatno daje brojeve 0–5 i prvih pet priča', () => {
    expect(FREE_NUMBER_MAX).toBe(5);
    expect(FREE_STORY_COUNT).toBe(5);
    expect(canAccessNumber(5, false)).toBe(true);
    expect(canAccessNumber(6, false)).toBe(false);
    expect(canAccessStory(4, false)).toBe(true);
    expect(canAccessStory(5, false)).toBe(false);
  });
});
