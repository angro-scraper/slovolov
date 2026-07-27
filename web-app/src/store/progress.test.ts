import { beforeEach, describe, expect, it } from 'vitest';
import { useProgressStore } from './progress';

describe('lokalni napredak', () => {
  beforeEach(() => useProgressStore.getState().reset());

  it('dodeljuje jednu zvezdicu samo jednom po slovu', () => {
    useProgressStore.getState().learnLetter('А');
    useProgressStore.getState().learnLetter('А');
    expect(useProgressStore.getState().profile.learnedLetters).toEqual(['А']);
    expect(useProgressStore.getState().profile.stars).toBe(1);
  });

  it('dodeljuje jednu zvezdicu samo jednom po naučenom broju', () => {
    useProgressStore.getState().learnNumber(3);
    useProgressStore.getState().learnNumber(3);
    expect(useProgressStore.getState().profile.learnedNumbers).toEqual([3]);
    expect(useProgressStore.getState().profile.stars).toBe(1);
  });

  it('nagrađuje završeni nivo čitanja samo jednom', () => {
    useProgressStore.getState().completeReading('prica-sova');
    useProgressStore.getState().completeReading('prica-sova');
    expect(useProgressStore.getState().profile.completedReading).toEqual(['prica-sova']);
    expect(useProgressStore.getState().profile.stars).toBe(1);
  });

  it('pamti mesto slušanja bajke po profilu', () => {
    useProgressStore.getState().setStoryBookmark('zmaj-4-6', 3);
    expect(useProgressStore.getState().profile.storyBookmarks['zmaj-4-6']).toBe(3);
  });

  it('dnevni izazov daje tri zvezdice samo jednom dnevno', () => {
    useProgressStore.getState().completeDailyChallenge('2026-07-26');
    useProgressStore.getState().completeDailyChallenge('2026-07-26');
    expect(useProgressStore.getState().profile.completedDailyChallenges).toEqual(['2026-07-26']);
    expect(useProgressStore.getState().profile.stars).toBe(3);
  });

  it('čuva roditeljski nivo težine po profilu', () => {
    useProgressStore.getState().setDifficulty('challenge');
    expect(useProgressStore.getState().profile.difficulty).toBe('challenge');
  });

  it('podržava više lokalnih profila', () => {
    useProgressStore.getState().addProfile('Лука', '🐉');
    expect(useProgressStore.getState().profiles).toHaveLength(2);
    expect(useProgressStore.getState().profile.name).toBe('Лука');
  });

  it('čuva uneto ime i omogućava kasniju promenu imena', () => {
    expect(useProgressStore.getState().addProfile('  Лука  ', '🐉')).toBe(true);
    const profileId = useProgressStore.getState().profile.id;

    expect(useProgressStore.getState().profile.name).toBe('Лука');
    expect(useProgressStore.getState().renameProfile(profileId, '  Лазар  ')).toBe(true);
    expect(useProgressStore.getState().profile.name).toBe('Лазар');
  });

  it('ne prihvata prazno ime deteta', () => {
    expect(useProgressStore.getState().addProfile('   ', '🐉')).toBe(false);
    expect(useProgressStore.getState().profiles).toHaveLength(1);
    expect(useProgressStore.getState().renameProfile('local-child', '')).toBe(false);
    expect(useProgressStore.getState().profile.name).toBe('Мила');
  });

  it('lokalno pamti tačnost, vreme učenja i postavke pristupačnosti', () => {
    const store = useProgressStore.getState();

    store.recordSkillAttempt('letter:А', false);
    store.recordSkillAttempt('letter:А', true);
    store.addLearningSeconds(95);
    store.setAccessibility({
      reducedMotion: true,
      highContrast: true,
      largeText: true,
      dyslexiaFriendly: true
    });

    const state = useProgressStore.getState();
    expect(state.profile.skillStats['letter:А']).toMatchObject({ attempts: 2, successes: 1 });
    expect(state.profile.learningSeconds).toBe(95);
    expect(state.accessibility).toEqual({
      reducedMotion: true,
      highContrast: true,
      largeText: true,
      dyslexiaFriendly: true
    });
  });

  it('čuva kreativni rad bez mreže i nagrađuje završenu adaptivnu lekciju samo jednom', () => {
    const store = useProgressStore.getState();

    store.saveCreation('Мој змај лети изнад шуме.');
    store.completeLearningPath('2026-07-27');
    store.completeLearningPath('2026-07-27');

    const profile = useProgressStore.getState().profile;
    expect(profile.savedCreations).toContain('Мој змај лети изнад шуме.');
    expect(profile.completedLearningPaths).toEqual(['2026-07-27']);
    expect(profile.stars).toBe(3);
  });
});
