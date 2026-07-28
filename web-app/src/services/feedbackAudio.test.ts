import { describe, expect, it } from 'vitest';
import { resolveFeedbackAudio } from './feedbackAudio';

describe('lokalni zvuk dečjih povratnih poruka', () => {
  it.each([
    ['Bravo! Tačan odgovor!', 'bravo-correct.mp3'],
    ['Bravo! Pronađen par!', 'bravo-pair.mp3'],
    ['Bravo! Završio si svoju lekciju!', 'bravo-lesson.mp3'],
    ['Bravo! Osvojio si tri zvezdice!', 'bravo-three-stars.mp3'],
    ['Bravo! Razumeo si priču.', 'bravo-story.mp3'],
    ['Bravo! Razumeo si priču i osvojio zvezdicu!', 'bravo-story-star.mp3'],
    ['Bravo! Tvoja priča je sačuvana.', 'bravo-story-saved.mp3'],
    ['Tačno! Dve i jedna su tri.', 'math-correct.mp3'],
    ['Bravo! Lepo si napisao broj!', 'bravo-number-written.mp3'],
    ['Мама', 'word-mama.mp3'],
    ['Мак, рак.', 'rhyme-mak-rak.mp3']
  ])('mapira „%s” na snimak %s', (phrase, filename) => {
    expect(resolveFeedbackAudio(phrase)).toBe(`/audio/feedback/${filename}`);
  });
});
