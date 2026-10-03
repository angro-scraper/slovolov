import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { rhymeRounds, syllableSets, wordReadingRounds } from '../data/readingLessons';
import { logicChallenges } from '../data/logicChallenges';
import { readingStories } from '../data/stories';
import {
  adventureLiteracyAudio,
  dailyLogicAudio,
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
type CatalogProfile = {
  provider: string;
  voice: Record<string, unknown>;
  settings: Record<string, unknown>;
  model?: string;
};

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

function readingCatalog(): { profile: CatalogProfile; segments: Map<string, CatalogEntry> } {
  const catalogPath = resolve(process.cwd(), 'public', 'audio', 'reading', 'catalog.json');
  const parsed = JSON.parse(readFileSync(catalogPath, 'utf8')) as {
    profile: CatalogProfile;
    segments: CatalogEntry[];
  };
  return { profile: parsed.profile, segments: new Map(parsed.segments.map((entry) => [entry.path, entry])) };
}

function audioPath(source: string): string {
  return new URL(source, 'https://slovolov.test').pathname.replace(/^\/audio\/reading\//, '');
}

describe('stvarni lokalni audio za čitanje', () => {
  it('sledeći paket čitanja koristi odobreni ElevenLabs glas i ne čuva ključ u repozitorijumu', () => {
    const generator = readFileSync(resolve(process.cwd(), 'scripts', 'generate-reading-elevenlabs-audio.py'), 'utf8');
    const profile = readFileSync(resolve(process.cwd(), 'scripts', 'reading-elevenlabs-profile.json'), 'utf8');
    expect(profile).toContain('"voiceId": "d3l4f3HgkE3P6Fo91lYA"');
    expect(profile).toContain('"model": "eleven_v3"');
    expect(profile).toContain('"languageCode": "sr"');
    expect(generator).toContain('"language_code": settings["languageCode"]');
    expect(profile).toContain('"speed": 0.76');
    expect(profile).toContain('"stability": 0.55');
    expect(profile).toContain('"similarityBoost": 0.65');
    expect(generator).toContain('serbian_tts_text');
    expect(generator).toContain('STAGE_ROOT');
    expect(generator).toContain('PUBLIC_CATALOG_PATH');
    expect(generator).toContain('sys.stdout.reconfigure');
    expect(generator).not.toContain('SpeechSynthesisUtterance');
    expect(profile).toContain('"storeApiKeyInRepository": false');
    expect(profile).not.toMatch(/sk_[A-Za-z0-9]/);
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
      ...Array.from({ length: 6 }, (_, index) => adventureLiteracyAudio(index + 1)),
      ...logicChallenges.map((challenge) => dailyLogicAudio(challenge.id))
    ];

    expect(sources).toHaveLength(249);
    expect(sources.every((source) => existsSync(publicPath(source)))).toBe(true);
  });

  it('trenutni katalog prikazuje ćirilicu, ali je za izgovor čuva u srpskoj latinici', () => {
    const catalog = readingCatalog();
    expect(catalog.profile).toMatchObject({
      provider: 'ElevenLabs',
      voice: {
        displayName: 'Ida - Clear, Confident Serbian',
        voiceId: 'd3l4f3HgkE3P6Fo91lYA'
      },
      model: 'eleven_v3',
      settings: { languageCode: 'sr', speed: 0.76 }
    });
    expect(catalog.segments).toHaveLength(249);
    for (const entry of catalog.segments.values()) {
      expect(entry.displayText).not.toMatch(/[A-Za-z]/);
      expect(entry.spokenText).not.toMatch(/[А-Ша-ш]/);
      expect(entry.spokenText).toBe(expectedSerbianTts(entry.displayText));
    }

    for (const round of rhymeRounds) {
      const prompt = catalog.segments.get(audioPath(readingRhymeAudio(round.id, 'prompt')));
      const result = catalog.segments.get(audioPath(readingRhymeAudio(round.id, 'result')));
      expect(prompt?.displayText.toLocaleLowerCase('sr')).toContain(
        round.prompt.toLocaleLowerCase('sr')
      );
      expect(result?.displayText.toLocaleLowerCase('sr')).toContain(
        round.correct.toLocaleLowerCase('sr')
      );
    }
    for (const syllable of syllableSets.flatMap((set) => set.syllables)) {
      expect(catalog.segments.get(audioPath(readingSyllableAudio(syllable)))?.displayText).toBe(
        syllable.toLocaleLowerCase('sr')
      );
    }
    for (const word of wordReadingRounds.flatMap((round) => round.words.map((item) => item.word))) {
      expect(catalog.segments.get(audioPath(readingWordAudio(word)))?.displayText).toBe(
        word.toLocaleLowerCase('sr')
      );
    }
    for (const story of readingStories) {
      story.sentences.forEach((sentence, index) => {
        expect(
          catalog.segments.get(audioPath(readingStorySentenceAudio(story.id, index)))?.displayText
        ).toBe(sentence);
      });
    }
    for (const challenge of logicChallenges) {
      expect(catalog.segments.get(audioPath(dailyLogicAudio(challenge.id)))?.displayText).toBeTruthy();
    }
  });
});
