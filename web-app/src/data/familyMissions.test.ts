import { describe, expect, it } from 'vitest';
import { familyMissions } from './familyMissions';

describe('porodične misije', () => {
  it('imaju tri nivoa težine i aktivnost bez ekrana', () => {
    expect(new Set(familyMissions.map((mission) => mission.difficulty))).toEqual(
      new Set([1, 2, 3])
    );
    expect(familyMissions.length).toBeGreaterThanOrEqual(12);
    expect(familyMissions.every((mission) => mission.offline && mission.parentPrompt.length > 20)).toBe(true);
  });
});
