import { describe, expect, it } from 'vitest';
import { advancePlatformer, createPlatformerLevel, createPlatformerState } from './platformer';

describe('dečja 2D staza', () => {
  it('Sovica skače sa početne zemlje', () => {
    const level = createPlatformerLevel(['А', 'Б', 'В']);
    const next = advancePlatformer(createPlatformerState(), { direction: 0, jump: true }, level, .05);
    expect(next.y).toBeGreaterThan(0);
    expect(next.velocityY).toBeGreaterThan(0);
  });

  it('skuplja simbol tek kada mu se približi na stazi', () => {
    const level = createPlatformerLevel(['А', 'Б', 'В']);
    const start = { ...createPlatformerState(), x: 35, y: 25, velocityY: 0 };
    expect(advancePlatformer(start, { direction: 0, jump: false }, level, .01).collected).toContain('А');
  });

  it('ima platforme koje se mogu dostići jednim dečjim skokom', () => {
    const level = createPlatformerLevel(['А', 'Б', 'В']);
    expect(level.platforms[3].y - level.platforms[2].y).toBeLessThan(18);
  });
});
