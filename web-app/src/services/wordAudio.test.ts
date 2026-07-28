import { describe, expect, it } from 'vitest';
import { resolveWordAudio } from './wordAudio';

describe('lokalni izgovor reči iz igara i vežbi', () => {
  it('koristi postojeće snimke iz kviza za ćirilicu i latinicu', () => {
    expect(resolveWordAudio('Авион')).toContain('/audio/quiz/01.mp3');
    expect(resolveWordAudio('Avion')).toContain('/audio/quiz/01.mp3');
    expect(resolveWordAudio('Балон')).toContain('/audio/quiz/04.mp3');
  });
});
