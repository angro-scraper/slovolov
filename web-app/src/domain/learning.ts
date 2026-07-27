export type SkillProgress = {
  attempts: number;
  successes: number;
  currentStreak: number;
  lastPracticedAt: string;
};

export type LearningStats = Record<string, SkillProgress>;

export function recordLearningAttempt(
  stats: LearningStats,
  skill: string,
  success: boolean,
  practicedAt = new Date().toISOString()
): LearningStats {
  const previous = stats[skill] ?? {
    attempts: 0,
    successes: 0,
    currentStreak: 0,
    lastPracticedAt: practicedAt
  };
  return {
    ...stats,
    [skill]: {
      attempts: previous.attempts + 1,
      successes: previous.successes + (success ? 1 : 0),
      currentStreak: success ? previous.currentStreak + 1 : 0,
      lastPracticedAt: practicedAt
    }
  };
}

export function masteryFor(stats: LearningStats, skill: string) {
  const progress = stats[skill];
  if (!progress?.attempts) return 0;
  const accuracy = progress.successes / progress.attempts;
  const repetitionBonus = Math.min(progress.currentStreak, 4) * 0.05;
  return Math.round(Math.min(1, accuracy + repetitionBonus) * 100);
}

export function nextLetterToPractice(
  alphabet: string[],
  learnedLetters: string[],
  stats: LearningStats
) {
  const practicedWeakLetters = alphabet
    .filter((letter) => stats[`letter:${letter}`]?.attempts)
    .map((letter) => ({ letter, mastery: masteryFor(stats, `letter:${letter}`) }))
    .filter(({ mastery }) => mastery < 75)
    .sort((first, second) => first.mastery - second.mastery);

  if (practicedWeakLetters.length) return practicedWeakLetters[0].letter;
  return alphabet.find((letter) => !learnedLetters.includes(letter)) ?? alphabet[0];
}

export function summarizeLearning(stats: LearningStats) {
  const entries = Object.entries(stats);
  const attempts = entries.reduce((sum, [, progress]) => sum + progress.attempts, 0);
  const successes = entries.reduce((sum, [, progress]) => sum + progress.successes, 0);
  return {
    practicedSkills: entries.length,
    attempts,
    successes,
    accuracy: attempts ? Math.round(successes / attempts * 100) : 0,
    needsPractice: entries
      .filter(([skill]) => masteryFor(stats, skill) < 75)
      .sort(([first], [second]) => masteryFor(stats, first) - masteryFor(stats, second))
      .map(([skill]) => skill)
  };
}
