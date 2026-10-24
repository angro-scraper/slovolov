import { letters } from './letters';

export const rewardCollections = [
  { id: 'animals', name: 'Životinje', emoji: '🦁', letters: ['В', 'Ж', 'З', 'Л', 'М', 'О', 'П', 'Р', 'Ћ', 'Ф'] },
  { id: 'vehicles', name: 'Vozila', emoji: '🚀', letters: ['А', 'Т', 'Ч'] },
  { id: 'fruit', name: 'Voće', emoji: '🍎', letters: ['Ј', 'Џ'] },
  { id: 'nature', name: 'Priroda', emoji: '🌳', letters: ['Д', 'Њ', 'С', 'Ц', 'Ш'] }
] as const;

export function getStickerCollectionProgress(learnedLetters: readonly string[]) {
  const learned = new Set(learnedLetters);
  return rewardCollections.map((collection) => {
    const stickers = collection.letters.map((upper) => letters.find((letter) => letter.upper === upper)!).filter(Boolean);
    const earned = stickers.filter((letter) => learned.has(letter.upper));
    return {
      ...collection,
      stickers,
      earned,
      earnedCount: earned.length,
      total: stickers.length,
      unlocked: earned.length === stickers.length
    };
  });
}
