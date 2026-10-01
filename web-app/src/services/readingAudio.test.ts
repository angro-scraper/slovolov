import { describe, expect, it } from 'vitest';
import {
  adventureLiteracyAudio,
  dailyLogicAudio,
  readingRhymeAudio,
  readingStorySentenceAudio,
  readingSyllableAudio,
  readingWordAudio
} from './readingAudio';
import { AUDIO_ASSET_VERSION } from './audioAssets';

describe('lokalni Ida audio za čitanje', () => {
  it('mapira rime, slogove, reči i priče na lokalne snimke', () => {
    expect(readingRhymeAudio('mak', 'prompt')).toContain('/audio/reading/rhyme-mak-prompt.mp3');
    expect(readingSyllableAudio('МА')).toContain('/audio/reading/syllable-ma.mp3');
    expect(readingWordAudio('СОВА')).toContain('/audio/reading/word-sova.mp3');
    expect(readingStorySentenceAudio('lana-cvet-6-8', 1))
      .toContain('/audio/reading/stories/lana-cvet-6-8-2.mp3');
  });

  it('uvek traži novi provereni Ida paket, a ne stari keš uređaja', () => {
    expect(AUDIO_ASSET_VERSION).toBe('sr-ida-reading-v16-20261001');
    expect(readingRhymeAudio('mak', 'prompt'))
      .toContain('v=sr-ida-reading-v16-20261001');
    expect(readingWordAudio('СОВА'))
      .toContain('v=sr-ida-reading-v16-20261001');
  });

  it('avantura koristi Ida naratorske instrukcije sa novom oznakom keša', () => {
    expect(adventureLiteracyAudio(1)).toContain('/audio/reading/adventure/literacy-1.mp3');
    expect(adventureLiteracyAudio(6)).toContain('/audio/reading/adventure/literacy-6.mp3');
    expect(adventureLiteracyAudio(1)).toContain('v=sr-ida-reading-v16-20261001');
  });

  it('Dnevni izazov mapira svako logičko pitanje na poseban Ida snimak', () => {
    expect(dailyLogicAudio('add-1')).toContain('/audio/reading/daily/logic-add-1.mp3');
    expect(dailyLogicAudio('logic-1')).toContain('/audio/reading/daily/logic-logic-1.mp3');
    expect(dailyLogicAudio('time-1')).toContain('v=sr-ida-reading-v16-20261001');
  });
});
