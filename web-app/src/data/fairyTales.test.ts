import { describe, expect, it } from 'vitest';
import { fairyTales } from './fairyTales';

describe('biblioteka bajki sa zvukom', () => {
  it('sadrži 74 jedinstvena izdanja, po 37 klasičnih bajki za svaki uzrast', () => {
    expect(fairyTales).toHaveLength(74);
    expect(new Set(fairyTales.map((story) => story.id)).size).toBe(74);
    expect(fairyTales.filter((story) => story.age === '4–6')).toHaveLength(37);
    expect(fairyTales.filter((story) => story.age === '7–10')).toHaveLength(37);
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

  it('sadrži stvarne klasične bajke umesto varijacija istog šablona', () => {
    const titles = [...new Set(fairyTales.map((story) => story.title))];

    expect(titles).toEqual(expect.arrayContaining([
      'Ивица и Марица',
      'Пинокио',
      'Црвенкапа',
      'Три прасета',
      'Пепељуга',
      'Снежана и седам патуљака',
      'Ружно паче',
      'Царево ново одело'
    ]));
    expect(titles).toHaveLength(37);
  });

  it('navodi javnodomenski izvor i autora za svaku originalnu adaptaciju', () => {
    for (const story of fairyTales) {
      expect(story.source.author.length).toBeGreaterThan(2);
      expect(story.source.work.length).toBeGreaterThan(2);
      expect(story.source.url).toMatch(/^https:\/\//);
      expect(story.source.publicDomain).toBe(true);
      expect(story.adaptation).toBe('originalna-srpska-adaptacija');
    }
  });

  it('ne vraća raniji generički zaplet o mapi, tri znaka i pronađenom predmetu', () => {
    const allText = fairyTales.flatMap((story) => story.sentences).join(' ');

    expect(allText).not.toContain('три тачна одговора');
    expect(allText).not.toContain('симболе сложили редом');
    expect(allText).not.toContain('Пронађено благо нису сакрили');
    expect(new Set(fairyTales.map((story) => story.plotKey)).size).toBe(37);
  });
});
