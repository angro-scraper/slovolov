import { createHash } from 'node:crypto';
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
  it('katalog i ključni snimci zadržavaju odobreni Ida narator', () => {
    const catalog = JSON.parse(readFileSync(resolve(process.cwd(), 'public', 'audio', 'reading', 'catalog.json'), 'utf8'));
    expect(catalog.profile.voice.voiceId).toBe('d3l4f3HgkE3P6Fo91lYA');
    const approved = [
      ['rhyme-mak-prompt.mp3', 'b4f55cca724e1883ec3cb0a9b6ba17846e3666adef54d8a2540ac1adcfd26ef9'],
      ['daily/logic-add-1.mp3', '3165160243356f695f93820d55d3828e90c1f99e1fe9a1ce282f472398eacc8d'],
      ['stories/ana-balon-4-6-1.mp3', 'f81cac72f113ef862089b3d34037254d7cf32c06e9bab041af4a4d065c7541da']
    ];
    for (const [name, hash] of approved) {
      const bytes = readFileSync(resolve(process.cwd(), 'public', 'audio', 'reading', name));
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(hash);
    }
  });

  it('alternativni generator ne može slučajno prepisati odobrene snimke', () => {
    const generator = readFileSync(resolve(process.cwd(), 'scripts', 'generate-reading-audio.py'), 'utf8');
    expect(generator).toContain('--replace-approved-voice');
    expect(generator).toContain('catalog.get("profile", {}).get("provider") == "ElevenLabs"');
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
