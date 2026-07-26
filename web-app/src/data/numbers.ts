export type NumberLesson = {
  value: number;
  word: string;
  emoji: string;
  countLabel: string;
  color: string;
};

const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#f97316', '#8b5cf6'];

export const numberLessons: NumberLesson[] = [
  { value: 0, word: 'нула', emoji: '⭐', countLabel: 'zvezdica', color: colors[0] },
  { value: 1, word: 'један', emoji: '🍎', countLabel: 'jabuka', color: colors[1] },
  { value: 2, word: 'два', emoji: '🦋', countLabel: 'leptira', color: colors[2] },
  { value: 3, word: 'три', emoji: '🚗', countLabel: 'automobila', color: colors[3] },
  { value: 4, word: 'четири', emoji: '🐝', countLabel: 'pčele', color: colors[4] },
  { value: 5, word: 'пет', emoji: '🎈', countLabel: 'balona', color: colors[0] },
  { value: 6, word: 'шест', emoji: '🌼', countLabel: 'cvetova', color: colors[1] },
  { value: 7, word: 'седам', emoji: '🐞', countLabel: 'bubamara', color: colors[2] },
  { value: 8, word: 'осам', emoji: '🐟', countLabel: 'riba', color: colors[3] },
  { value: 9, word: 'девет', emoji: '🍓', countLabel: 'jagoda', color: colors[4] },
  { value: 10, word: 'десет', emoji: '🚀', countLabel: 'raketa', color: colors[0] }
];
