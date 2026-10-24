import { describe, expect, it } from 'vitest';
import { getStickerCollectionProgress } from './rewardCollections';

describe('kolekcije nagrad po naučenim slovima', () => {
  it('prati četiri kolekcije i otključava kolekciju tek kada su sve njene nalepnice osvojene', () => {
    const initial = getStickerCollectionProgress([]);
    expect(initial.map(({ name }) => name)).toEqual(['Životinje', 'Vozila', 'Voće', 'Priroda']);
    expect(initial.every(({ earnedCount, unlocked }) => earnedCount === 0 && !unlocked)).toBe(true);

    const animals = getStickerCollectionProgress(['В', 'Ж', 'З', 'Л', 'М', 'О', 'П', 'Р', 'Ћ', 'Ф']);
    expect(animals[0]).toMatchObject({ earnedCount: 10, total: 10, unlocked: true });
    expect(animals[1]).toMatchObject({ earnedCount: 0, total: 3, unlocked: false });
  });
});
