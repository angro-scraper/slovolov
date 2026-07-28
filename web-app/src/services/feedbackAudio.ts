const FEEDBACK_AUDIO: Readonly<Record<string, string>> = {
  'bravo! dobio si zvezdicu. idemo na sledeće slovo!':
    '/audio/feedback/bravo-next-letter.mp3',
  'bravo! naučio si novo slovo!':
    '/audio/feedback/bravo-new-letter.mp3',
  'bravo! tačan odgovor!':
    '/audio/feedback/bravo-correct.mp3',
  'bravo! pronađen par!':
    '/audio/feedback/bravo-pair.mp3',
  'bravo! završio si svoju lekciju!':
    '/audio/feedback/bravo-lesson.mp3',
  'bravo! osvojio si tri zvezdice!':
    '/audio/feedback/bravo-three-stars.mp3',
  'bravo! razumeo si priču.':
    '/audio/feedback/bravo-story.mp3',
  'bravo! razumeo si priču i osvojio zvezdicu!':
    '/audio/feedback/bravo-story-star.mp3',
  'bravo! tvoja priča je sačuvana.':
    '/audio/feedback/bravo-story-saved.mp3',
  'tačno! dve i jedna su tri.':
    '/audio/feedback/math-correct.mp3',
  'bravo! lepo si napisao broj!':
    '/audio/feedback/bravo-number-written.mp3',
  'мама':
    '/audio/feedback/word-mama.mp3',
  'мак, рак.':
    '/audio/feedback/rhyme-mak-rak.mp3',
  'pokušaj ponovo.':
    '/audio/feedback/try-again.mp3'
};

function normalize(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLocaleLowerCase('sr-Latn');
}

export function resolveFeedbackAudio(text: string): string | null {
  return FEEDBACK_AUDIO[normalize(text)] ?? null;
}
