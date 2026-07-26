import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fairyTales } from './data/fairyTales';

describe('PWA audio knjige', () => {
  it('kešira snimljene priče za offline slušanje bez mreže', () => {
    const config = readFileSync(resolve(process.cwd(), 'vite.config.ts'), 'utf8');

    expect(config).toContain('woff2,mp3');
    expect(config).toContain("url.pathname.startsWith('/audio/stories/')");
    expect(config).toContain("handler: 'CacheFirst'");
    expect(config).toContain("cacheName: 'slovolov-story-audio-v1'");
    expect(config).toContain('rangeRequests: true');
  });

  it('svaka bajka označena kao snimljena ima stvarni audio za svaku rečenicu', () => {
    const recordedStories = fairyTales.filter((story) => story.recordedAudio);
    const uniqueStories = [...new Map(recordedStories.map((story) => [story.audioKey, story])).values()];

    for (const story of uniqueStories) {
      story.sentences.forEach((_, index) => {
        const audioPath = resolve(process.cwd(), 'public', 'audio', 'stories', `${story.audioKey}-${index + 1}.mp3`);
        expect(existsSync(audioPath), audioPath).toBe(true);
        expect(statSync(audioPath).size, audioPath).toBeGreaterThan(1_000);
      });
    }
  });
});
