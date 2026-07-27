import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('PWA audio knjige', () => {
  it('kešira snimljene priče za offline slušanje bez mreže', () => {
    const config = readFileSync(resolve(process.cwd(), 'vite.config.ts'), 'utf8');

    expect(config).toContain('woff2}');
    expect(config).not.toContain('woff2,mp3');
    expect(config).toContain("url.pathname.startsWith('/audio/stories/')");
    expect(config).toContain("handler: 'CacheFirst'");
    expect(config).toContain("cacheName: 'slovolov-story-audio-v3'");
    expect(config).toContain('rangeRequests: true');
  });

  it('kešira svih 60 srpskih snimaka slova i primera', () => {
    const config = readFileSync(resolve(process.cwd(), 'vite.config.ts'), 'utf8');
    expect(config).toContain("url.pathname.startsWith('/audio/letters/')");
    expect(config).toContain("cacheName: 'slovolov-letter-audio-v1'");

    for (let index = 1; index <= 30; index += 1) {
      for (const kind of ['sound', 'example']) {
        const filename = `${String(index).padStart(2, '0')}-${kind}.mp3`;
        const audioPath = resolve(process.cwd(), 'public', 'audio', 'letters', filename);
        expect(existsSync(audioPath), audioPath).toBe(true);
        expect(statSync(audioPath).size, audioPath).toBeGreaterThan(10_000);
      }
    }
  });

  it('svaka bajka označena kao snimljena ima stvarni audio za svaku rečenicu', () => {
    const manifest = JSON.parse(
      readFileSync(resolve(process.cwd(), 'public', 'content', 'stories', 'manifest.json'), 'utf8')
    );
    for (const entry of manifest) {
      const story = JSON.parse(
        readFileSync(resolve(process.cwd(), 'public', 'content', 'stories', `${entry.id}.json`), 'utf8')
      );
      if (!story.audio.available) continue;
      for (let index = 0; index < story.sentenceCount; index += 1) {
        const audioPath = resolve(process.cwd(), 'public', 'audio', 'stories', `${story.audio.key}-${index + 1}.mp3`);
        expect(existsSync(audioPath), audioPath).toBe(true);
        expect(statSync(audioPath).size, audioPath).toBeGreaterThan(1_000);
      }
    }
  });
});
