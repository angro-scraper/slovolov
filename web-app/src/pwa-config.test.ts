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
    expect(config).toContain("cacheName: 'slovolov-story-audio-v4'");
    expect(config).toContain('rangeRequests: true');
  });

  it('kešira tačno jedan srpski snimak za svaku od 30 lekcija', () => {
    const config = readFileSync(resolve(process.cwd(), 'vite.config.ts'), 'utf8');
    expect(config).toContain("url.pathname.startsWith('/audio/letters/')");
    expect(config).toContain("cacheName: 'slovolov-letter-audio-v5'");
    expect(config).toContain("cacheName: 'slovolov-number-audio-v1'");
    expect(config).toContain("cacheName: 'slovolov-quiz-audio-v2'");

    for (let index = 1; index <= 30; index += 1) {
      const filename = `${String(index).padStart(2, '0')}-lesson.mp3`;
      const audioPath = resolve(process.cwd(), 'public', 'audio', 'letters', filename);
      expect(existsSync(audioPath), audioPath).toBe(true);
      expect(statSync(audioPath).size, audioPath).toBeGreaterThan(10_000);
    }
  });

  it('ključne Bravo poruke su deo offline paketa', () => {
    const config = readFileSync(resolve(process.cwd(), 'vite.config.ts'), 'utf8');

    expect(config).toContain("'audio/feedback/*.mp3'");
    for (const filename of [
      'bravo-next-letter.mp3',
      'bravo-new-letter.mp3',
      'try-again.mp3'
    ]) {
      const audioPath = resolve(process.cwd(), 'public', 'audio', 'feedback', filename);
      expect(existsSync(audioPath), audioPath).toBe(true);
      expect(statSync(audioPath).size, audioPath).toBeGreaterThan(5_000);
    }
  });

  it('sve Moje knjige mogu da se slušaju offline istim naratorom', () => {
    const config = readFileSync(resolve(process.cwd(), 'vite.config.ts'), 'utf8');
    expect(config).toContain("'audio/creative/*.mp3'");
    const audioRoot = resolve(process.cwd(), 'public', 'audio', 'creative');
    for (const filename of [
      'opening-h1-p1.mp3',
      'challenge-q4-p4.mp3',
      'solution-a4-q4.mp3',
      'ending-e4-h4.mp3'
    ]) {
      const audioPath = resolve(audioRoot, filename);
      expect(existsSync(audioPath), audioPath).toBe(true);
      expect(statSync(audioPath).size, audioPath).toBeGreaterThan(10_000);
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
