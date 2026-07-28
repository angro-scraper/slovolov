export type NumberLesson = {
  value: number;
  word: string;
  emoji: string;
  countLabel: string;
  color: string;
};

const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#f97316', '#8b5cf6'];
const pictures = ['🍎', '🦋', '🚗', '🐝', '🎈', '🌼', '🐞', '🐟', '🍓', '🚀'];
const smallNumbers = [
  'нула',
  'један',
  'два',
  'три',
  'четири',
  'пет',
  'шест',
  'седам',
  'осам',
  'девет',
  'десет',
  'једанаест',
  'дванаест',
  'тринаест',
  'четрнаест',
  'петнаест',
  'шеснаест',
  'седамнаест',
  'осамнаест',
  'деветнаест'
] as const;
const tens = [
  '',
  '',
  'двадесет',
  'тридесет',
  'четрдесет',
  'педесет',
  'шездесет',
  'седамдесет',
  'осамдесет',
  'деведесет'
] as const;

export function serbianNumberWord(value: number): string {
  if (value === 100) return 'сто';
  if (value < 20) return smallNumbers[value] ?? '';
  const ones = value % 10;
  const tensWord = tens[Math.floor(value / 10)] ?? '';
  return ones === 0 ? tensWord : `${tensWord} ${smallNumbers[ones]}`;
}

export const numberLessons: NumberLesson[] = Array.from({ length: 101 }, (_, value) => ({
  value,
  word: serbianNumberWord(value),
  emoji: value === 0 ? '⭐' : pictures[(value - 1) % pictures.length],
  countLabel: 'sličica',
  color: colors[value % colors.length]
}));
