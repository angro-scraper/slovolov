import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fullStoryContentIds } from './fullStoryContentManifest';

const storyRoot = resolve(process.cwd(), 'public', 'content', 'stories');
const manifest = JSON.parse(readFileSync(resolve(storyRoot, 'manifest.json'), 'utf8'));

describe('objavljena biblioteka celih bajki', () => {
  it('manifest i stvarni JSON fajlovi imaju iste proverene naslove', () => {
    expect(manifest).toHaveLength(37);
    expect(manifest.reduce((sum: number, story: { wordCount: number }) => sum + story.wordCount, 0))
      .toBe(44_868);
    expect(manifest.reduce((sum: number, story: { sentenceCount: number }) => sum + story.sentenceCount, 0))
      .toBe(2_260);
    expect(manifest.map((story: { id: string }) => story.id).sort()).toEqual([...fullStoryContentIds].sort());
    for (const id of fullStoryContentIds) {
      expect(existsSync(resolve(storyRoot, `${id}.json`))).toBe(true);
    }
  });

  it('svaka cela bajka je ćirilična, izvorno označena i nije skraćeni seed', () => {
    for (const id of fullStoryContentIds) {
      const story = JSON.parse(readFileSync(resolve(storyRoot, `${id}.json`), 'utf8'));
      const sentences = story.pages.flat();
      const text = sentences.join(' ');
      expect(story.review).toEqual(expect.objectContaining({
        sourceCoverage: 'verified',
        publicationReady: true
      }));
      expect(story.source.provider).toBe('Srpski Wikizvornik');
      expect(story.source.url).toMatch(/^https:\/\/sr\.wikisource\.org\//);
      expect(story.source.license).toBe('CC BY-SA 4.0');
      expect(story.pages.length).toBeGreaterThanOrEqual(2);
      expect(sentences).toHaveLength(story.sentenceCount);
      expect(sentences.every((sentence: string) => (
        sentence.length >= 8 && (sentence.match(/\p{L}/gu)?.length ?? 0) >= 3
      ))).toBe(true);
      expect(text.split(/\s+/)).toHaveLength(story.wordCount);
      expect(text).toMatch(/[А-Ша-ш]/);
      expect(text).not.toMatch(/[A-Za-zñ�ÃÅ]/);
      expect(story.wordCount).toBeGreaterThanOrEqual(250);
    }
  });

  it('svih 37 celih bajki imaju svaki stvarni MP3 segment', () => {
    for (const id of fullStoryContentIds) {
      const story = JSON.parse(readFileSync(resolve(storyRoot, `${id}.json`), 'utf8'));
      expect(story.audio.available, id).toBe(true);
      expect(story.audio.sentenceCount).toBe(story.sentenceCount);
      for (let index = 1; index <= story.sentenceCount; index += 1) {
        const path = resolve(process.cwd(), 'public', 'audio', 'stories', `${story.audio.key}-${index}.mp3`);
        expect(existsSync(path), path).toBe(true);
        expect(statSync(path).size, path).toBeGreaterThan(1_000);
      }
    }
  });
});
