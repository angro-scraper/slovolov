import { describe, expect, it } from 'vitest';
import { seededChoices } from './choices';

describe('mešanje ponuđenih odgovora', () => {
  it('čuva sve odgovore, ali menja položaj tačnog odgovora po zadatku', () => {
    const source = ['tačno', 'drugo', 'treće'];
    const positions = [0, 1, 2].map((seed) => seededChoices(source, seed).indexOf('tačno'));
    expect(new Set(positions).size).toBe(3);
    expect(seededChoices(source, 0)).toEqual(['drugo', 'treće', 'tačno']);
  });
});
