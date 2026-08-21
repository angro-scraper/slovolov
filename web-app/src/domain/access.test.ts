import { describe, expect, it } from 'vitest';
import {
  FREE_LETTER_COUNT,
  FREE_NUMBER_MAX,
  FREE_STORY_COUNT,
  canAccessFeature,
  canAccessLetter,
  canAccessNumber,
  canAccessStory,
  canAddProfile
} from './access';

describe('Slovolov Premium granice', () => {
  it('ostavlja prvih 7 slova besplatnim, a ostala otključava tek potvrđena pretplata', () => {
    expect(FREE_LETTER_COUNT).toBe(7);
    expect(canAccessLetter(0, false)).toBe(true);
    expect(canAccessLetter(6, false)).toBe(true);
    expect(canAccessLetter(7, false)).toBe(false);
    expect(canAccessLetter(29, true)).toBe(true);
    expect(canAccessLetter(30, true)).toBe(false);
  });

  it('ostavlja brojeve 0–10 i prve tri priče besplatnim', () => {
    expect(FREE_NUMBER_MAX).toBe(10);
    expect(FREE_STORY_COUNT).toBe(3);
    expect(canAccessNumber(10, false)).toBe(true);
    expect(canAccessNumber(11, false)).toBe(false);
    expect(canAccessNumber(100, true)).toBe(true);
    expect(canAccessNumber(101, true)).toBe(false);
    expect(canAccessStory(2, false)).toBe(true);
    expect(canAccessStory(3, false)).toBe(false);
    expect(canAccessStory(3, true)).toBe(true);
  });

  it('zaključava napredne module i dodatne profile dok StoreKit ne potvrdi Premium', () => {
    expect(canAccessFeature('learn', false)).toBe(true);
    expect(canAccessFeature('fairy-tales', false)).toBe(true);
    expect(canAccessFeature('games', false)).toBe(false);
    expect(canAccessFeature('reading', false)).toBe(false);
    expect(canAccessFeature('games', true)).toBe(true);
    expect(canAddProfile(1, false)).toBe(false);
    expect(canAddProfile(1, true)).toBe(true);
  });
});
