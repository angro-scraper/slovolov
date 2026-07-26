import { describe, expect, it } from 'vitest';
import { fairyTales } from './fairyTales';

describe('biblioteka bajki sa zvukom', () => {
  it('sadrži 60 jedinstvenih priča, po 30 za svaki uzrast', () => {
    expect(fairyTales).toHaveLength(60);
    expect(new Set(fairyTales.map((story) => story.id)).size).toBe(60);
    expect(fairyTales.filter((story) => story.age === '4–6')).toHaveLength(30);
    expect(fairyTales.filter((story) => story.age === '7–10')).toHaveLength(30);
  });

  it('svaka priča je puna digitalna knjiga, a ne sažetak', () => {
    for (const story of fairyTales) {
      expect(story.sentences.join(' ')).toMatch(/[А-Ша-ш]/);
      expect(story.pages.length).toBeGreaterThanOrEqual(story.age === '4–6' ? 8 : 10);
      expect(story.sentences).toEqual(story.pages.flat());
      expect(story.sentences.join(' ').split(/\s+/).length).toBeGreaterThanOrEqual(
        story.age === '4–6' ? 180 : 400
      );
      expect(story.answers).toContain(story.correct);
      expect(story.audioKey).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('generičke završnice ne pripisuju detetu pogrešan gramatički rod', () => {
    const allText = fairyTales.flatMap((story) => story.sentences).join(' ');

    expect(allText).not.toContain('да би је сутра испричао');
    expect(allText).not.toContain('да би је сутра испричала');
  });
});
