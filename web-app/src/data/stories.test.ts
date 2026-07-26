import { describe, expect, it } from 'vitest';
import { readingStories } from './stories';

describe('biblioteka priča', () => {
  it('sadrži najmanje 50 različitih priča i najmanje 20 za svaki uzrast', () => {
    expect(readingStories.length).toBeGreaterThanOrEqual(50);
    expect(new Set(readingStories.map((story) => story.id)).size).toBe(readingStories.length);
    expect(new Set(readingStories.map((story) => story.title)).size).toBe(readingStories.length);
    for (const age of ['4–6', '6–8', '8–10']) {
      expect(readingStories.filter((story) => story.age === age)).toHaveLength(20);
    }
  });

  it('svaka priča ima pitanje, tačan odgovor i najmanje dve rečenice', () => {
    for (const story of readingStories) {
      expect(story.sentences.length).toBeGreaterThanOrEqual(2);
      expect(story.answers).toContain(story.correct);
      expect(story.question.length).toBeGreaterThan(5);
    }
  });
});
