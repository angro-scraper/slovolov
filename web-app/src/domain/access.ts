export const FREE_LETTER_COUNT = 7;
export const FREE_NUMBER_MAX = 10;
export const FREE_STORY_COUNT = 3;

export function canAccessLetter(index: number, familyUnlocked: boolean): boolean {
  return familyUnlocked || (Number.isInteger(index) && index >= 0 && index < FREE_LETTER_COUNT);
}

export function canAccessNumber(value: number, familyUnlocked: boolean): boolean {
  return familyUnlocked || (Number.isInteger(value) && value >= 0 && value <= FREE_NUMBER_MAX);
}

export function canAccessStory(index: number, familyUnlocked: boolean): boolean {
  return familyUnlocked || (Number.isInteger(index) && index >= 0 && index < FREE_STORY_COUNT);
}

export function canAddProfile(profileCount: number, familyUnlocked: boolean): boolean {
  return familyUnlocked || profileCount < 1;
}
