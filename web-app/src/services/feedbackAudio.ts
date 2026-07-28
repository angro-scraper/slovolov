const FEEDBACK_AUDIO: Readonly<Record<string, string>> = {
  'bravo! dobio si zvezdicu. idemo na sledeće slovo!':
    '/audio/feedback/bravo-next-letter.mp3',
  'bravo! naučio si novo slovo!':
    '/audio/feedback/bravo-new-letter.mp3',
  'pokušaj ponovo.':
    '/audio/feedback/try-again.mp3'
};

function normalize(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLocaleLowerCase('sr-Latn');
}

export function resolveFeedbackAudio(text: string): string | null {
  return FEEDBACK_AUDIO[normalize(text)] ?? null;
}
