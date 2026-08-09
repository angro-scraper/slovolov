export type TrailKind = 'letters' | 'numbers' | 'words' | 'stars';

export type Trail = {
  id: string;
  title: string;
  subtitle: string;
  scene: string;
  kind: TrailKind;
  targets: string[];
  distractors: string[];
};

/** Kratke staze su zasebna igra: dete skuplja samo tačne simbole redom. */
export const trails: Trail[] = [
  { id: 'trail-forest', title: 'Šuma slova', subtitle: 'Sakupi slova А, Б i В.', scene: '🌲', kind: 'letters', targets: ['А', 'Б', 'В'], distractors: ['М', 'О', 'С'] },
  { id: 'trail-sea', title: 'More brojeva', subtitle: 'Sakupi brojeve 1, 2 i 3.', scene: '🌊', kind: 'numbers', targets: ['1', '2', '3'], distractors: ['4', '5', '6'] },
  { id: 'trail-city', title: 'Grad reči', subtitle: 'Sakupi početna slova poznatih reči.', scene: '🏙️', kind: 'words', targets: ['М', 'А', 'С'], distractors: ['Т', 'Н', 'Р'] },
  { id: 'trail-space', title: 'Zvezdana staza', subtitle: 'Sakupi završne zvezdice.', scene: '🚀', kind: 'stars', targets: ['А', '1', 'Б'], distractors: ['Ж', '7', 'Ш'] }
];

export function trailChoices(trail: Trail, step: number): string[] {
  const target = trail.targets[step];
  const distractors = trail.distractors.filter((item) => item !== target).slice(0, 2);
  return [target, ...distractors].sort((left, right) => left.localeCompare(right, 'sr'));
}

export function isTrailUnlocked(index: number, completedGames: string[]): boolean {
  return index === 0 || completedGames.includes(trails[index - 1].id);
}
