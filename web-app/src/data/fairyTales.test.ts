import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createFairyTaleCatalog, fairyTales } from './fairyTales';
import { fullStoryContentIds } from './fullStoryContentManifest';

describe('biblioteka bajki sa zvukom', () => {
  it('sadrži 74 jedinstvena izdanja, po 37 klasičnih bajki za svaki uzrast', () => {
    expect(fairyTales).toHaveLength(74);
    expect(new Set(fairyTales.map((story) => story.id)).size).toBe(74);
    expect(fairyTales.filter((story) => story.age === '4–6')).toHaveLength(37);
    expect(fairyTales.filter((story) => story.age === '7–10')).toHaveLength(37);
  });

  it('svaka priča upućuje na zaseban, izvorno proveren puni sadržaj', () => {
    for (const story of fairyTales) {
      expect(story.sentences.join(' ')).toMatch(/[А-Ша-ш]/);
      expect(story.edition).toBe('complete');
      expect(story.narration).toBe('audio-first');
      expect(story.sentences).toEqual(story.pages.flat());
      expect(story.reviewed).toBe(true);
      expect(story.fullContentAvailable).toBe(true);
      expect(fullStoryContentIds).toContain(story.plotKey);
      expect(story.answers).toContain(story.correct);
      expect(story.audioKey).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('ne prikazuje sažete rukopise u objavljenoj biblioteci celih priča', () => {
    expect(fairyTales.every((story) => story.edition === 'complete')).toBe(true);
    expect(fairyTales.some((story) => story.plotKey === 'ivica-i-marica')).toBe(false);
  });

  it('generičke završnice ne pripisuju detetu pogrešan gramatički rod', () => {
    const allText = fairyTales.flatMap((story) => story.sentences).join(' ');

    expect(allText).not.toContain('да би је сутра испричао');
    expect(allText).not.toContain('да би је сутра испричала');
  });

  it('sadrži 37 različitih izvornih bajki i srpskih narodnih pripovedaka', () => {
    const titles = [...new Set(fairyTales.map((story) => story.title))];

    expect(titles).toEqual(expect.arrayContaining([
      'Пепељуга',
      'Ружно паче',
      'Царево ново одело',
      'Чардак ни на небу ни на земљи',
      'Златна јабука и девет пауница',
      'Немушти језик'
    ]));
    expect(titles).toHaveLength(37);
  });

  it('navodi javnodomensko delo i proverljivu Wikizvornik stranicu', () => {
    for (const story of fairyTales) {
      expect(story.source.author.length).toBeGreaterThan(2);
      expect(story.source.work.length).toBeGreaterThan(2);
      expect(story.source.url).toMatch(/^https:\/\//);
      expect(story.source.publicDomain).toBe(true);
      expect(story.fullContentAvailable).toBe(true);
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

  it('prodavničko izdanje koristi samo dečje prilagođene priče', () => {
    const storeStories = createFairyTaleCatalog('store-safe');

    expect(storeStories).toHaveLength(74);
    expect(new Set(storeStories.map((story) => story.plotKey)).size).toBe(37);
    expect(storeStories.every((story) => story.edition === 'abridged')).toBe(true);
    expect(storeStories.every((story) => !story.fullContentAvailable)).toBe(true);
    expect(storeStories.every((story) => story.reviewed === false)).toBe(true);
    expect(storeStories.every((story) => story.recordedAudio === true)).toBe(true);
    expect(storeStories.every((story) => story.audioKey.endsWith('-sazeta'))).toBe(true);
    for (const story of storeStories) {
      story.sentences.forEach((_, index) => {
        const audioPath = resolve(
          process.cwd(),
          'public',
          'audio',
          'stories',
          `${story.audioKey}-${index + 1}.mp3`
        );
        expect(existsSync(audioPath), audioPath).toBe(true);
        expect(statSync(audioPath).size, audioPath).toBeGreaterThan(1_000);
        const fallbackPath = audioPath.replace(/\.mp3$/i, '.ogg');
        expect(existsSync(fallbackPath), fallbackPath).toBe(true);
        expect(statSync(fallbackPath).size, fallbackPath).toBeGreaterThan(1_000);
      });
    }
  });

  it('snimci priča koriste MPEG-1 MP3 koji podržavaju i stariji Android tableti', () => {
    const storeStories = createFairyTaleCatalog('store-safe');

    for (const story of storeStories) {
      story.sentences.forEach((_, index) => {
        const audioPath = resolve(
          process.cwd(),
          'public',
          'audio',
          'stories',
          `${story.audioKey}-${index + 1}.mp3`
        );
        const bytes = readFileSync(audioPath);
        const frameOffset = bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33
          ? 10 + ((bytes[6] & 0x7f) << 21) + ((bytes[7] & 0x7f) << 14)
            + ((bytes[8] & 0x7f) << 7) + (bytes[9] & 0x7f)
          : 0;

        expect(bytes[frameOffset], audioPath).toBe(0xff);
        expect(bytes[frameOffset + 1] & 0xe0, audioPath).toBe(0xe0);
        expect(bytes[frameOffset + 1] & 0x18, audioPath).toBe(0x18);
      });
    }
  }, 20_000);

  it('prodavnički katalog nema eksplicitne scene iz izvornih izdanja', () => {
    const storeText = createFairyTaleCatalog('store-safe')
      .flatMap((story) => story.sentences)
      .join(' ')
      .toLocaleLowerCase('sr');

    for (const explicitPhrase of [
      'те га прождере',
      'одмах га растргну',
      'те га распори',
      'за врат те удави',
      'сама себе усред срца',
      'сама себе лијеву руку осијече',
      'десну у огњу изгори'
    ]) {
      expect(storeText).not.toContain(explicitPhrase);
    }
  });
});
