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
  it('ostavlja prvih 7 slova besplatnim, a ostala otključava kupovina', () => {
    expect(FREE_LETTER_COUNT).toBe(7);
    expect(canAccessLetter(6, false)).toBe(true);
    expect(canAccessLetter(7, false)).toBe(false);
    expect(canAccessLetter(29, true)).toBe(true);
  });

  it('besplatno daje brojeve 0–10 i prve tri priče', () => {
    expect(FREE_NUMBER_MAX).toBe(10);
    expect(FREE_STORY_COUNT).toBe(3);
    expect(canAccessNumber(10, false)).toBe(true);
    expect(canAccessNumber(11, false)).toBe(false);
    expect(canAccessStory(2, false)).toBe(true);
    expect(canAccessStory(3, false)).toBe(false);
  });
});
