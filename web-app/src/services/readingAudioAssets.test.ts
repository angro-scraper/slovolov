import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { rhymeRounds, syllableSets, wordReadingRounds } from '../data/readingLessons';
import { readingStories } from '../data/stories';
import {
  adventureLiteracyAudio,
  readingRhymeAudio,
  readingStorySentenceAudio,
  readingSyllableAudio,
  readingWordAudio
} from './readingAudio';

function publicPath(source: string): string {
  const pathname = new URL(source, 'https://slovolov.test').pathname.replace(/^\//, '');
  return resolve(process.cwd(), 'public', pathname);
}

describe('stvarni lokalni audio za čitanje', () => {
  it('generator koristi isti profil glavnog Sophie naratora kao audio-priče', () => {
    const generator = readFileSync(resolve(process.cwd(), 'scripts', 'generate-reading-audio.py'), 'utf8');
    expect(generator).toContain('VOICE = "sr-RS-SophieNeural"');
    expect(generator).toContain('RATE = "-8%"');
    expect(generator).toContain('PITCH = "+2Hz"');
    expect(generator).toContain('pitch=PITCH');
    expect(generator).toContain('"Напиши велико слово А."');
    expect(generator).not.toContain('"Napiši veliko slovo A."');
    expect(generator).not.toContain('SpeechSynthesisUtterance');
  });

  it('svaki prikazani primer ima svoj lokalni MP3', () => {
    const sources = [
      ...rhymeRounds.flatMap((round) => [
        readingRhymeAudio(round.id, 'prompt'),
        readingRhymeAudio(round.id, 'result')
      ]),
      ...syllableSets.flatMap((set) => set.syllables.map(readingSyllableAudio)),
      ...wordReadingRounds.flatMap((round) => round.words.map((word) => readingWordAudio(word.word))),
      ...readingStories.flatMap((story) =>
        story.sentences.map((_, index) => readingStorySentenceAudio(story.id, index))
      ),
      ...Array.from({ length: 6 }, (_, index) => adventureLiteracyAudio(index + 1))
    ];

    expect(sources).toHaveLength(241);
    expect(sources.every((source) => existsSync(publicPath(source)))).toBe(true);
  });
});
