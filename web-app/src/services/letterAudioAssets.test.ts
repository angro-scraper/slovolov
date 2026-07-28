import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('srpski izgovor slova', () => {
  it('generator koristi jedan srpski glas i jednu kratku lekciju po slovu', () => {
    const generator = readFileSync(
      resolve(process.cwd(), 'scripts', 'generate-letter-audio.py'),
      'utf8'
    );

    expect(generator).toContain('VOICE = "sr-RS-SophieNeural"');
    expect(generator).toContain("Ово је слово {letter['upper']}");
    expect(generator).toContain("{letter['upper']} као {example}");
    expect(generator).not.toContain('PHONETIC_STARTS');
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
});
