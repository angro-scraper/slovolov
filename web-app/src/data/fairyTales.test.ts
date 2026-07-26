import { describe, expect, it } from 'vitest';
import { fairyTales } from './fairyTales';

describe('biblioteka bajki sa zvukom', () => {
  it('sadrži 60 jedinstvenih priča, po 30 za svaki uzrast', () => {
    expect(fairyTales).toHaveLength(60);
    expect(new Set(fairyTales.map((story) => story.id)).size).toBe(60);
    expect(fairyTales.filter((story) => story.age === '4–6')).toHaveLength(30);
    expect(fairyTales.filter((story) => story.age === '7–10')).toHaveLength(30);
  });

  it('svaka priča ima ćirilični tekst, pitanje i dovoljno rečenica', () => {
    for (const story of fairyTales) {
      expect(story.sentences.join(' ')).toMatch(/[А-Ша-ш]/);
      expect(story.sentences.length).toBeGreaterThanOrEqual(story.age === '4–6' ? 4 : 6);
      expect(story.answers).toContain(story.correct);
      expect(story.audioKey).toMatch(/^[a-z0-9-]+$/);
    }
  });
});
