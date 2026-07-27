import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearFullStoryCache, loadFullStoryContent } from './fullStoryLibrary';

const validStory = {
  id: 'ruzno-pace',
  title: 'Ружно паче',
  language: 'sr-Cyrl',
  pages: [['Прва реченица.', 'Друга реченица.'], ['Трећа реченица.']],
  sentenceCount: 3,
  wordCount: 6,
  audio: { available: false, key: 'ruzno-pace-full', sentenceCount: 3 },
  source: {
    provider: 'Srpski Wikizvornik',
    author: 'Hans Kristijan Andersen',
    translator: null,
    url: 'https://sr.wikisource.org/',
    revisionId: 1,
    license: 'CC BY-SA 4.0'
  },
  review: { sourceCoverage: 'verified', languageReview: 'source-edition', publicationReady: true }
};

afterEach(clearFullStoryCache);

describe('biblioteka celih bajki', () => {
  it('učitava proverenu bajku tek kada je zatražena i zatim koristi keš', async () => {
    const request = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => validStory
    });
    await expect(loadFullStoryContent('ruzno-pace', undefined, request)).resolves.toEqual(validStory);
    await expect(loadFullStoryContent('ruzno-pace', undefined, request)).resolves.toEqual(validStory);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith('/content/stories/ruzno-pace.json', expect.any(Object));
  });

  it('odbija sadržaj koji nije označen kao celovit i pregledan', async () => {
    const request = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ...validStory, review: { ...validStory.review, publicationReady: false } })
    });
    await expect(loadFullStoryContent('ruzno-pace', undefined, request))
      .rejects.toThrow('nije prošla proveru');
  });

  it('prikazuje stvarnu HTTP grešku bez lažnog uspeha', async () => {
    const request = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    await expect(loadFullStoryContent('ne-postoji', undefined, request))
      .rejects.toThrow('HTTP 404');
  });
});
