import { describe, expect, it } from 'vitest';
import { statSync } from 'node:fs';
import { resolve } from 'node:path';
import { createQuizRound, quizQuestions } from './quizQuestions';

describe('proširena baza slikovnog kviza', () => {
  it('sadrži 90 različitih slika i 60 novih pitanja', () => {
    expect(quizQuestions).toHaveLength(90);
    expect(new Set(quizQuestions.map((question) => question.emoji)).size).toBe(90);
    expect(new Set(quizQuestions.map((question) => question.audioSource)).size).toBe(90);
  });

  it('svako od 30 slova ima po tri pitanja', () => {
    for (let letterIndex = 0; letterIndex < 30; letterIndex += 1) {
      expect(quizQuestions.filter((question) => question.letterIndex === letterIndex)).toHaveLength(3);
    }
  });

  it('pravi determinističku rundu bez ponovljenih slika', () => {
    const first = createQuizRound(20260727);
    const second = createQuizRound(20260727);
    expect(first).toEqual(second);
    expect(first).toHaveLength(10);
    expect(new Set(first.map((question) => question.id)).size).toBe(10);
  });

  it('svako pitanje ima stvarni lokalni audio snimak', () => {
    for (const question of quizQuestions) {
      const audioPath = resolve(process.cwd(), 'public', question.audioSource.replace(/^\//, ''));
      expect(statSync(audioPath).size, question.audioSource).toBeGreaterThan(5_000);
    }
  });
});
