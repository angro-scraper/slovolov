import { describe, expect, it } from 'vitest';
import { fairyTales } from './fairyTales';

describe('biblioteka bajki sa zvukom', () => {
  it('sadrži 74 jedinstvena izdanja, po 37 klasičnih bajki za svaki uzrast', () => {
    expect(fairyTales).toHaveLength(74);
    expect(new Set(fairyTales.map((story) => story.id)).size).toBe(74);
    expect(fairyTales.filter((story) => story.age === '4–6')).toHaveLength(37);
    expect(fairyTales.filter((story) => story.age === '7–10')).toHaveLength(37);
  });

  it('svaka priča ima istinit status izdanja i audio-first tok', () => {
    for (const story of fairyTales) {
      expect(story.sentences.join(' ')).toMatch(/[А-Ша-ш]/);
      expect(['complete', 'abridged']).toContain(story.edition);
      expect(story.narration).toBe('audio-first');
      expect(story.pages.length).toBeGreaterThanOrEqual(10);
      expect(story.sentences).toEqual(story.pages.flat());
      if (story.edition === 'complete') {
        expect(story.reviewed).toBe(true);
        expect(story.sentences.join(' ').split(/\s+/).length).toBeGreaterThanOrEqual(500);
      } else {
        expect(story.reviewed).toBe(false);
      }
      expect(story.answers).toContain(story.correct);
      expect(story.audioKey).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('Ivicu i Maricu isporučuje kao ručno pregledanu celu priču', () => {
    const editions = fairyTales.filter((story) => story.plotKey === 'ivica-i-marica');

    expect(editions).toHaveLength(2);
    expect(editions.every((story) => story.edition === 'complete' && story.reviewed)).toBe(true);
    expect(editions[0].sentences.join(' ')).toContain('На самом рубу велике шуме');
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

  it('ne popunjava stranice ponavljajućim nastavnim rečenicama', () => {
    const allText = fairyTales.flatMap((story) => story.sentences).join(' ');

    expect(allText).not.toContain('Застани на тренутак и замисли почетак');
    expect(allText).not.toContain('ништа од овога није само украс');
    expect(allText).not.toContain('Тако оригинална радња бајке');
    expect(allText).not.toContain('Приповедач нас не позива само');
  });
});
