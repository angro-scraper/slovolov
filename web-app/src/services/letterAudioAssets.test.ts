import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('srpski izgovor slova', () => {
  it('generator zadržava poseban referentni muški fonetski izgovor slova', () => {
    const generator = readFileSync(
      resolve(process.cwd(), 'scripts', 'generate-letter-audio.py'),
      'utf8'
    );

    expect(generator).toContain('REFERENCE_AUDIO');
    expect(generator).toContain('REFERENCE_SEGMENTS');
    expect(generator).toContain('save_letter_lesson');
    expect(generator).toContain('str(REFERENCE_AUDIO)');
    expect(generator).toContain('str(letter_clip)');
    expect(generator).toContain('save_reference_sound');
    expect(generator).toContain('--reference-clips');
  });

  it('svih 30 slova ima tačno jedan lokalni audio-snimak lekcije', () => {
    for (let index = 1; index <= 30; index += 1) {
      const prefix = String(index).padStart(2, '0');
      expect(readFileSync(resolve(
        process.cwd(),
        'public',
        'audio',
        'letters',
        `${prefix}-lesson.mp3`
      )).byteLength).toBeGreaterThan(5_000);
    }
  });

  it('svih 30 slova ima i zaseban lokalni muški fonetski snimak', () => {
    for (let index = 1; index <= 30; index += 1) {
      const prefix = String(index).padStart(2, '0');
      expect(readFileSync(resolve(
        process.cwd(), 'public', 'audio', 'letters', `${prefix}-sound.mp3`
      )).byteLength).toBeGreaterThan(3_000);
    }
  });

  it('odobreni referentni izgovor nije ponovo prepisan drugim naratorom', () => {
    const approved = readFileSync(resolve(process.cwd(), 'public', 'audio', 'letters', '01-lesson.mp3'));
    expect(createHash('sha256').update(approved).digest('hex')).toBe(
      '22bf72bef9e9e289f59152ba4c55b6f7bccaa872ff29c5521580a23cf3d60dde'
    );
    const maleSound = readFileSync(resolve(process.cwd(), 'public', 'audio', 'letters', '01-sound.mp3'));
    expect(createHash('sha256').update(maleSound).digest('hex')).toBe(
      '17f798ba52775bb35a36ca5a0bfc11bd24058d5178aedc5c1e420d69ebb823dd'
    );
  });

  it('ključne povratne poruke imaju lokalne audio-snimke', () => {
    for (const name of [
      'bravo-next-letter',
      'bravo-new-letter',
      'bravo-next-number',
      'bravo-correct',
      'bravo-pair',
      'bravo-lesson',
      'bravo-three-stars',
      'bravo-story',
      'bravo-story-star',
      'bravo-story-saved',
      'bravo-number-written',
      'math-correct',
      'number-question',
      'word-mama',
      'rhyme-mak-rak',
      'try-again'
    ]) {
      expect(readFileSync(resolve(
        process.cwd(),
        'public',
        'audio',
        'feedback',
        `${name}.mp3`
      )).byteLength).toBeGreaterThan(5_000);
    }
  });
});
