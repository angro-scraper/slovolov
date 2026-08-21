export const FREE_LETTER_COUNT = 7;
export const FREE_NUMBER_MAX = 10;
export const FREE_STORY_COUNT = 3;

const PREMIUM_FEATURES = new Set([
  'adventure',
  'voice',
  'family-missions',
  'logic',
  'culture',
  'adaptive',
  'daily',
  'games',
  'quiz',
  'reading',
  'creative'
]);

export function canAccessLetter(index: number, familyUnlocked: boolean): boolean {
  if (!Number.isInteger(index) || index < 0 || index >= 30) return false;
  return familyUnlocked || index < FREE_LETTER_COUNT;
}

export function canAccessNumber(value: number, familyUnlocked: boolean): boolean {
  if (!Number.isInteger(value) || value < 0 || value > 100) return false;
  return familyUnlocked || value <= FREE_NUMBER_MAX;
}

export function canAccessStory(index: number, familyUnlocked: boolean): boolean {
  if (!Number.isInteger(index) || index < 0) return false;
  return familyUnlocked || index < FREE_STORY_COUNT;
}

export function canAddProfile(profileCount: number, familyUnlocked: boolean): boolean {
  if (!Number.isInteger(profileCount) || profileCount < 0) return false;
  return familyUnlocked || profileCount < 1;
}

export function canAccessFeature(feature: string, familyUnlocked: boolean): boolean {
  return familyUnlocked || !PREMIUM_FEATURES.has(feature);
}
