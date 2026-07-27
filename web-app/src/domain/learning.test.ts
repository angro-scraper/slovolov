import { describe, expect, it } from 'vitest';
import {
  masteryFor,
  nextLetterToPractice,
  recordLearningAttempt,
  summarizeLearning,
  type LearningStats
} from './learning';

describe('adaptivni model učenja', () => {
  it('pamti uspešne i neuspešne pokušaje bez gubitka prethodnih rezultata', () => {
    const first = recordLearningAttempt({}, 'letter:А', false, '2026-07-27T10:00:00.000Z');
    const second = recordLearningAttempt(first, 'letter:А', true, '2026-07-27T10:01:00.000Z');

    expect(second['letter:А']).toMatchObject({
      attempts: 2,
      successes: 1,
      currentStreak: 1,
      lastPracticedAt: '2026-07-27T10:01:00.000Z'
    });
  });

  it('predlaže problematično slovo pre još neotvorenog slova', () => {
    const stats: LearningStats = {
      'letter:А': { attempts: 5, successes: 1, currentStreak: 0, lastPracticedAt: '2026-07-27T10:00:00.000Z' },
      'letter:Б': { attempts: 4, successes: 4, currentStreak: 4, lastPracticedAt: '2026-07-27T10:00:00.000Z' }
    };

    expect(nextLetterToPractice(['А', 'Б', 'В'], ['А', 'Б'], stats)).toBe('А');
  });

  it('posle savladanih slova bira prvo novo slovo', () => {
    const stats: LearningStats = {
      'letter:А': { attempts: 4, successes: 4, currentStreak: 4, lastPracticedAt: '2026-07-27T10:00:00.000Z' }
    };

    expect(nextLetterToPractice(['А', 'Б', 'В'], ['А'], stats)).toBe('Б');
    expect(masteryFor(stats, 'letter:А')).toBe(100);
  });

  it('pravi roditeljski pregled tačnosti i vežbanih veština', () => {
    const stats: LearningStats = {
      'letter:А': { attempts: 3, successes: 2, currentStreak: 1, lastPracticedAt: '2026-07-27T10:00:00.000Z' },
      'number:1': { attempts: 2, successes: 2, currentStreak: 2, lastPracticedAt: '2026-07-27T10:02:00.000Z' }
    };

    expect(summarizeLearning(stats)).toEqual({
      practicedSkills: 2,
      attempts: 5,
      successes: 4,
      accuracy: 80,
      needsPractice: ['letter:А']
    });
  });
});
