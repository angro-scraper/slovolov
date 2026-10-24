import { describe, expect, it } from 'vitest';
import { AUDIO_ASSET_VERSION } from './audioAssets';
import { resolveLetterAudio } from './letterAudio';

describe('lokalni srpski izgovor slova', () => {
  it('menja URL paketa da tablet ne zadrži neispravan MP3 keš', () => {
    expect(AUDIO_ASSET_VERSION).toBe('sr-ida-reading-male-letters-v18-20261025');
  });

  it.each([
    ['Ј', '/audio/letters/11-sound.mp3'],
    ['j', '/audio/letters/11-sound.mp3'],
    ['Љ', '/audio/letters/14-sound.mp3'],
    ['Nj', '/audio/letters/17-sound.mp3'],
    ['Џ', '/audio/letters/29-sound.mp3']
  ])('vezuje %s za tačan lokalni snimak', (text, source) => {
    expect(resolveLetterAudio(text)?.source).toBe(`${source}?v=${AUDIO_ASSET_VERSION}`);
  });

  it.each([
    ['Ј као Јабука', '/audio/letters/11-lesson.mp3'],
    ['Љ, као Љубичица.', '/audio/letters/14-lesson.mp3'],
    ['Dž kao džip', '/audio/letters/29-lesson.mp3']
  ])('vezuje primer %s za snimljenu srpsku frazu', (text, source) => {
    expect(resolveLetterAudio(text)?.source).toBe(`${source}?v=${AUDIO_ASSET_VERSION}`);
  });

  it('ne presreće običnu rečenicu', () => {
    expect(resolveLetterAudio('Bravo! Naučio si novo slovo.')).toBeUndefined();
  });

  it('samo slovo ima zaseban muški izgovor, a primer celu lekciju', () => {
    expect(resolveLetterAudio('Ј')?.source).toContain('11-sound.mp3');
    expect(resolveLetterAudio('Ј као Јагода')?.source).toContain('11-lesson.mp3');
  });
});
