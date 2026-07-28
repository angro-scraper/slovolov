import { describe, expect, it } from 'vitest';
import { resolveLetterAudio } from './letterAudio';

describe('lokalni srpski izgovor slova', () => {
  it.each([
    ['Ј', '/audio/letters/11-lesson.mp3'],
    ['j', '/audio/letters/11-lesson.mp3'],
    ['Љ', '/audio/letters/14-lesson.mp3'],
    ['Nj', '/audio/letters/17-lesson.mp3'],
    ['Џ', '/audio/letters/29-lesson.mp3']
  ])('vezuje %s za tačan lokalni snimak', (text, source) => {
    expect(resolveLetterAudio(text)?.source).toBe(`${source}?v=sr-sophie-lesson-v2-20260728`);
  });

  it.each([
    ['Ј као Јабука', '/audio/letters/11-lesson.mp3'],
    ['Љ, као Љубичица.', '/audio/letters/14-lesson.mp3'],
    ['Dž kao džip', '/audio/letters/29-lesson.mp3']
  ])('vezuje primer %s za snimljenu srpsku frazu', (text, source) => {
    expect(resolveLetterAudio(text)?.source).toBe(`${source}?v=sr-sophie-lesson-v2-20260728`);
  });

  it('ne presreće običnu rečenicu', () => {
    expect(resolveLetterAudio('Bravo! Naučio si novo slovo.')).toBeUndefined();
  });

  it('slovo i primer uvek koriste isti jedini snimak', () => {
    expect(resolveLetterAudio('Ј')?.source).toBe(
      resolveLetterAudio('Ј као Јагода')?.source
    );
  });
});
