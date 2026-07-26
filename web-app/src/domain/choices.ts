export function seededChoices<T>(items: readonly T[], seed: number): T[] {
  if (items.length < 2) return [...items];
  const offset = (seed * 2 + 1) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}
