export type NumberLesson = {
  value: number;
  word: string;
  emoji: string;
  color: string;
};

const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#f97316', '#8b5cf6'];

export const numberLessons: NumberLesson[] = [
  { value: 0, word: 'нула', emoji: '⭐', color: colors[0] },
  { value: 1, word: 'један', emoji: '🍎', color: colors[1] },
  { value: 2, word: 'два', emoji: '🦋', color: colors[2] },
  { value: 3, word: 'три', emoji: '🚗', color: colors[3] },
  { value: 4, word: 'четири', emoji: '🐝', color: colors[4] },
  { value: 5, word: 'пет', emoji: '🎈', color: colors[0] },
  { value: 6, word: 'шест', emoji: '🌼', color: colors[1] },
  { value: 7, word: 'седам', emoji: '🐞', color: colors[2] },
  { value: 8, word: 'осам', emoji: '🐟', color: colors[3] },
  { value: 9, word: 'девет', emoji: '🍓', color: colors[4] },
  { value: 10, word: 'десет', emoji: '🚀', color: colors[0] }
];
