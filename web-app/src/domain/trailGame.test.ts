import { describe, expect, it } from 'vitest';
import { isTrailUnlocked, trails, trailChoices } from './trailGame';

describe('staze avanture', () => {
  it('imaju četiri različite teme i svaka ima mali niz ciljeva', () => {
    expect(trails.map((trail) => trail.id)).toEqual(['trail-forest', 'trail-sea', 'trail-city', 'trail-space']);
    expect(new Set(trails.map((trail) => trail.scene)).size).toBe(4);
    expect(trails.every((trail) => trail.targets.length === 3)).toBe(true);
  });

  it('nudi tačan simbol uz dve bezbedne različite opcije', () => {
    const choices = trailChoices(trails[0], 1);
    expect(choices).toContain('Б');
    expect(choices).toHaveLength(3);
    expect(new Set(choices).size).toBe(3);
  });

  it('otključava narednu stazu tek posle završetka prethodne', () => {
    expect(isTrailUnlocked(0, [])).toBe(true);
    expect(isTrailUnlocked(1, [])).toBe(false);
    expect(isTrailUnlocked(1, ['trail-forest'])).toBe(true);
  });
});
