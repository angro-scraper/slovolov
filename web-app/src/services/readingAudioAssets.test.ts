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
  it('generator čitanja koristi zaključan Ana SRB ElevenLabs profil, bez ključa u repozitorijumu', () => {
    const generator = readFileSync(resolve(process.cwd(), 'scripts', 'generate-reading-elevenlabs-audio.py'), 'utf8');
    const profile = readFileSync(resolve(process.cwd(), 'scripts', 'reading-elevenlabs-profile.json'), 'utf8');
    expect(generator).toContain('ELEVENLABS_API_KEY');
    expect(generator).toContain('ELEVENLABS_READING_VOICE_ID');
    expect(profile).toContain('"outputFormat": "mp3_44100_128"');
    expect(generator).toContain('synthesize');
    expect(profile).toContain('Ana SRB - Call center voice');
    expect(profile).toContain('"speed": 0.81');
    expect(profile).toContain('"similarityBoost": 0.27');
    expect(profile).toContain('"stability": 1.0');
    expect(generator).not.toContain('SpeechSynthesisUtterance');
    expect(generator).not.toContain('xi-api-key:');
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
