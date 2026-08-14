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

type CatalogEntry = { path: string; displayText: string; spokenText: string };

const serbianLatin: Record<string, string> = {
  А: 'A', Б: 'B', В: 'V', Г: 'G', Д: 'D', Ђ: 'Đ', Е: 'E', Ж: 'Ž', З: 'Z',
  И: 'I', Ј: 'J', К: 'K', Л: 'L', Љ: 'Lj', М: 'M', Н: 'N', Њ: 'Nj', О: 'O',
  П: 'P', Р: 'R', С: 'S', Т: 'T', Ћ: 'Ć', У: 'U', Ф: 'F', Х: 'H', Ц: 'C',
  Ч: 'Č', Џ: 'Dž', Ш: 'Š', а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ђ: 'đ',
  е: 'e', ж: 'ž', з: 'z', и: 'i', ј: 'j', к: 'k', л: 'l', љ: 'lj', м: 'm',
  н: 'n', њ: 'nj', о: 'o', п: 'p', р: 'r', с: 's', т: 't', ћ: 'ć', у: 'u',
  ф: 'f', х: 'h', ц: 'c', ч: 'č', џ: 'dž', ш: 'š'
};

function expectedSerbianTts(displayText: string): string {
  return Array.from(displayText, (letter) => serbianLatin[letter] ?? letter).join('');
}

function readingCatalog(): Map<string, CatalogEntry> {
  const catalogPath = resolve(process.cwd(), 'public', 'audio', 'reading', 'catalog.json');
  const parsed = JSON.parse(readFileSync(catalogPath, 'utf8')) as { segments: CatalogEntry[] };
  return new Map(parsed.segments.map((entry) => [entry.path, entry]));
}

function audioPath(source: string): string {
  return new URL(source, 'https://slovolov.test').pathname.replace(/^\/audio\/reading\//, '');
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
    expect(generator).toContain('apply_text_normalization');
    expect(generator).toContain('PUBLIC_CATALOG_PATH');
    expect(generator).toContain('sys.stdout.reconfigure');
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

  it('katalog prikazuje ćirilicu, ali Ani šalje tačnu srpsku latinicu', () => {
    const catalog = readingCatalog();
    expect(catalog).toHaveLength(241);
    for (const entry of catalog.values()) {
      expect(entry.displayText).not.toMatch(/[A-Za-z]/);
      expect(entry.spokenText).not.toMatch(/[А-Ша-ш]/);
      expect(entry.spokenText).toBe(expectedSerbianTts(entry.displayText));
    }

    for (const round of rhymeRounds) {
      const prompt = catalog.get(audioPath(readingRhymeAudio(round.id, 'prompt')));
      const result = catalog.get(audioPath(readingRhymeAudio(round.id, 'result')));
      expect(prompt?.displayText.toLocaleLowerCase('sr')).toContain(
        round.prompt.toLocaleLowerCase('sr')
      );
      expect(result?.displayText.toLocaleLowerCase('sr')).toContain(
        round.correct.toLocaleLowerCase('sr')
      );
    }
    for (const syllable of syllableSets.flatMap((set) => set.syllables)) {
      expect(catalog.get(audioPath(readingSyllableAudio(syllable)))?.displayText).toBe(
        syllable.toLocaleLowerCase('sr')
      );
    }
    for (const word of wordReadingRounds.flatMap((round) => round.words.map((item) => item.word))) {
      expect(catalog.get(audioPath(readingWordAudio(word)))?.displayText).toBe(
        word.toLocaleLowerCase('sr')
      );
    }
    for (const story of readingStories) {
      story.sentences.forEach((sentence, index) => {
        expect(
          catalog.get(audioPath(readingStorySentenceAudio(story.id, index)))?.displayText
        ).toBe(sentence);
      });
    }
  });
});
