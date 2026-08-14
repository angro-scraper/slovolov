import { describe, expect, it } from 'vitest';
import {
  adventureLiteracyAudio,
  readingRhymeAudio,
  readingStorySentenceAudio,
  readingSyllableAudio,
  readingWordAudio
} from './readingAudio';
import { AUDIO_ASSET_VERSION } from './audioAssets';

describe('lokalni Ana SRB audio za čitanje', () => {
  it('mapira rime, slogove, reči i priče na lokalne snimke', () => {
    expect(readingRhymeAudio('mak', 'prompt')).toContain('/audio/reading/rhyme-mak-prompt.mp3');
    expect(readingSyllableAudio('МА')).toContain('/audio/reading/syllable-ma.mp3');
    expect(readingWordAudio('СОВА')).toContain('/audio/reading/word-sova.mp3');
    expect(readingStorySentenceAudio('lana-cvet-6-8', 1))
      .toContain('/audio/reading/stories/lana-cvet-6-8-2.mp3');
  });

  it('uvek traži novi provereni Ana SRB paket, a ne stari keš uređaja', () => {
    expect(AUDIO_ASSET_VERSION).toBe('sr-ana-reading-v14-latin-20260814');
    expect(readingRhymeAudio('mak', 'prompt'))
      .toContain('v=sr-ana-reading-v14-latin-20260814');
    expect(readingWordAudio('СОВА'))
      .toContain('v=sr-ana-reading-v14-latin-20260814');
  });

  it('avantura koristi naratorske instrukcije, ne mikrofon', () => {
    expect(adventureLiteracyAudio(1)).toContain('/audio/reading/adventure/literacy-1.mp3');
    expect(adventureLiteracyAudio(6)).toContain('/audio/reading/adventure/literacy-6.mp3');
  });
});
