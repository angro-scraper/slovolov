import { describe, expect, it } from 'vitest';
import { adventureWorlds, getAdventureProgress, isAdventureLevelUnlocked } from './adventure';

describe('Slovolov mapa avanture', () => {
  it('ima pet svetova i progresivno teže nivoe', () => {
    expect(adventureWorlds).toHaveLength(6);
    expect(adventureWorlds.flatMap((world) => world.levels)).toHaveLength(36);
    adventureWorlds.forEach((world) => {
      expect(world.levels.map((level) => level.difficulty)).toEqual(
        [...world.levels.map((level) => level.difficulty)].sort((a, b) => a - b)
      );
    });
  });

  it('otključava prvi nivo, a naredni tek posle prethodnog', () => {
    const levels = adventureWorlds.flatMap((world) => world.levels);
    expect(isAdventureLevelUnlocked(levels[0], [])).toBe(true);
    expect(isAdventureLevelUnlocked(levels[1], [])).toBe(false);
    expect(isAdventureLevelUnlocked(levels[1], [levels[0].id])).toBe(true);
  });

  it('računa stvarni napredak bez lažnog završavanja', () => {
    expect(getAdventureProgress(['voice-1', 'reading-1'])).toMatchObject({
      completed: 2,
      total: 36
    });
  });
});
