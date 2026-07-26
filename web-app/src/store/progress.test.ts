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
});
