import { describe, expect, it } from 'vitest';
import { logicChallenges } from './logicChallenges';

describe('svet brojeva i logike', () => {
  it('pokriva sabiranje, oduzimanje, poređenje, nizove, oblike, vreme, novac i logiku', () => {
    expect(new Set(logicChallenges.map((challenge) => challenge.kind))).toEqual(
      new Set(['addition', 'subtraction', 'compare', 'sequence', 'shape', 'time', 'money', 'logic'])
    );
    expect(logicChallenges.map((challenge) => challenge.level)).toEqual(
      [...logicChallenges.map((challenge) => challenge.level)].sort((a, b) => a - b)
    );
  });
});
