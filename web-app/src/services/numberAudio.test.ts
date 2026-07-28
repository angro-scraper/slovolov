import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveNumberAudio } from './numberAudio';

describe('lokalni izgovor brojeva', () => {
  it('prepoznaje ćirilični i latinični naziv broja', () => {
    expect(resolveNumberAudio('двадесет један')).toContain('/audio/numbers/021.mp3');
    expect(resolveNumberAudio('dvadeset jedan')).toContain('/audio/numbers/021.mp3');
    expect(resolveNumberAudio('сто')).toContain('/audio/numbers/100.mp3');
  });

  it('svih 101 brojeva ima lokalni srpski snimak', () => {
    for (let value = 0; value <= 100; value += 1) {
      expect(readFileSync(resolve(
        process.cwd(),
        'public',
        'audio',
        'numbers',
        `${String(value).padStart(3, '0')}.mp3`
      )).byteLength).toBeGreaterThan(4_000);
    }
  });
});
