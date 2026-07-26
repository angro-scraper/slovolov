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
});
