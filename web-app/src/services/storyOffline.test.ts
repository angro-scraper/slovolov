import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FullStoryContent } from './fullStoryLibrary';
import {
  downloadStoryForOffline,
  isStoryAvailableOffline,
  STORY_AUDIO_CACHE
} from './storyOffline';

const story = {
  id: 'proba',
  title: 'Проба',
  language: 'sr-Cyrl',
  pages: [['Прва.', 'Друга.']],
  sentenceCount: 2,
  wordCount: 250,
  audio: { available: true, key: 'proba-full', sentenceCount: 2 },
  source: {
    provider: 'Srpski Wikizvornik',
    author: 'Аутор',
    translator: null,
    url: 'https://sr.wikisource.org/wiki/Proba',
    revisionId: 1,
    license: 'CC BY-SA 4.0'
  },
  review: {
    sourceCoverage: 'verified',
    languageReview: 'source-edition',
    publicationReady: true
  }
} satisfies FullStoryContent;

describe('offline audio-bajka', () => {
  const stored = new Map<string, Response>();
  const cache = {
    match: vi.fn(async (url: string) => stored.get(url)),
    put: vi.fn(async (url: string, response: Response) => { stored.set(url, response); })
  };

  beforeEach(() => {
    stored.clear();
    vi.clearAllMocks();
    vi.stubGlobal('caches', { open: vi.fn(async () => cache) });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('preuzima svaki nedostajući segment i javlja stvarni napredak', async () => {
    const request = vi.fn(async () => new Response('audio', { status: 200 }));
    vi.stubGlobal('fetch', request);
    const progress = vi.fn();

    await downloadStoryForOffline(story, progress);

    expect(caches.open).toHaveBeenCalledWith(STORY_AUDIO_CACHE);
    expect(request).toHaveBeenCalledTimes(2);
    expect(cache.put).toHaveBeenCalledTimes(2);
    expect(progress).toHaveBeenLastCalledWith({ completed: 2, total: 2 });
    await expect(isStoryAvailableOffline(story)).resolves.toBe(true);
  });

  it('ne prikazuje uspeh kada mrežni segment nije preuzet', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 503 })));

    await expect(downloadStoryForOffline(story, vi.fn())).rejects.toThrow('segment 1');
    await expect(isStoryAvailableOffline(story)).resolves.toBe(false);
  });
});
