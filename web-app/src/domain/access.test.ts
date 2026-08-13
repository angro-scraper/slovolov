import { describe, expect, it } from 'vitest';
import {
  FREE_LETTER_COUNT,
  FREE_NUMBER_MAX,
  FREE_STORY_COUNT,
  canAccessLetter,
  canAccessNumber,
  canAccessStory
} from './access';

describe('Slovolov Premium granice', () => {
  it('ostavlja svih 30 slova besplatnim', () => {
    expect(FREE_LETTER_COUNT).toBe(30);
    expect(canAccessLetter(0, false)).toBe(true);
    expect(canAccessLetter(29, false)).toBe(true);
    expect(canAccessLetter(30, true)).toBe(false);
  });

  it('ostavlja brojeve 0–100 besplatnim, a zaključava tek četvrtu bajku/priču', () => {
    expect(FREE_NUMBER_MAX).toBe(100);
    expect(FREE_STORY_COUNT).toBe(3);
    expect(canAccessNumber(100, false)).toBe(true);
    expect(canAccessNumber(101, true)).toBe(false);
    expect(canAccessStory(2, false)).toBe(true);
    expect(canAccessStory(3, false)).toBe(false);
  });
});
