import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('audio paket Kreativnog studija', () => {
  it('koristi isti provereni Sophie glas kao ostatak Slovolova', () => {
    const generator = readFileSync(
      resolve(process.cwd(), 'scripts', 'generate-creative-audio.py'),
      'utf8'
    );
    expect(generator).toContain('VOICE = "sr-RS-SophieNeural"');
    expect(generator).toContain('NARRATION_RATE = "-18%"');
  });

  it('sadrži sva 64 lokalna naratorska segmenta', () => {
    const names = [
      ...Array.from({ length: 4 }, (_, hero) => Array.from(
        { length: 4 },
        (_, place) => `opening-h${hero + 1}-p${place + 1}.mp3`
      )).flat(),
      ...Array.from({ length: 4 }, (_, quest) => Array.from(
        { length: 4 },
        (_, place) => `challenge-q${quest + 1}-p${place + 1}.mp3`
      )).flat(),
      ...Array.from({ length: 4 }, (_, helper) => Array.from(
        { length: 4 },
        (_, quest) => `solution-a${helper + 1}-q${quest + 1}.mp3`
      )).flat(),
      ...Array.from({ length: 4 }, (_, ending) => Array.from(
        { length: 4 },
        (_, hero) => `ending-e${ending + 1}-h${hero + 1}.mp3`
      )).flat()
    ];
    expect(names).toHaveLength(64);
    for (const name of names) {
      expect(existsSync(resolve(process.cwd(), 'public', 'audio', 'creative', name)), name)
        .toBe(true);
    }
  });
});
