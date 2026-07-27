import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('srpski izgovor slova', () => {
  it('generator koristi fonetske početke i ne šalje izolovani znak TTS-u', () => {
    const generator = readFileSync(
      resolve(process.cwd(), 'scripts', 'generate-letter-audio.py'),
      'utf8'
    );

    expect(generator).toContain('PHONETIC_STARTS');
    expect(generator).toContain('"Ј": "ја"');
    expect(generator).toContain('"Љ": "љу"');
    expect(generator).toContain('"Њ": "њу"');
    expect(generator).toContain('"Џ": "џи"');
    expect(generator).not.toContain('Ovo je slovo');
    expect(generator).not.toContain("letter['upper']} kao");
  });

  it('svih 30 slova ima oba lokalna audio-snimka', () => {
    for (let index = 1; index <= 30; index += 1) {
      const prefix = String(index).padStart(2, '0');
      expect(readFileSync(resolve(
        process.cwd(),
        'public',
        'audio',
        'letters',
        `${prefix}-sound.mp3`
      )).byteLength).toBeGreaterThan(5_000);
      expect(readFileSync(resolve(
        process.cwd(),
        'public',
        'audio',
        'letters',
        `${prefix}-example.mp3`
      )).byteLength).toBeGreaterThan(5_000);
    }
  });
});
