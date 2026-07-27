export type FullStoryContent = {
  id: string;
  title: string;
  language: 'sr-Cyrl';
  pages: string[][];
  sentenceCount: number;
  wordCount: number;
  audio: {
    available: boolean;
    key: string;
    sentenceCount: number;
  };
  source: {
    provider: string;
    author: string;
    translator: string | null;
    url: string;
    revisionId: number | null;
    license: string;
  };
  review: {
    sourceCoverage: 'verified';
    languageReview: 'source-edition' | 'human-reviewed';
    publicationReady: true;
  };
};

const cache = new Map<string, FullStoryContent>();

function assertFullStoryContent(value: unknown, expectedId: string): FullStoryContent {
  const story = value as FullStoryContent;
  if (
    !story
    || story.id !== expectedId
    || story.language !== 'sr-Cyrl'
    || story.review?.sourceCoverage !== 'verified'
    || story.review?.publicationReady !== true
    || !Array.isArray(story.pages)
    || story.pages.length < 2
    || story.pages.some((page) => !Array.isArray(page) || page.length === 0)
    || story.pages.flat().some((sentence) => typeof sentence !== 'string' || sentence.trim().length < 2)
  ) {
    throw new Error('Cela bajka nije prošla proveru sadržaja.');
  }
  return story;
}

export async function loadFullStoryContent(
  id: string,
  signal?: AbortSignal,
  request: typeof fetch = fetch
): Promise<FullStoryContent> {
  const cached = cache.get(id);
  if (cached) return cached;
  const response = await request(`/content/stories/${encodeURIComponent(id)}.json`, {
    signal,
    headers: { accept: 'application/json' }
  });
  if (!response.ok) throw new Error(`Cela bajka nije dostupna (HTTP ${response.status}).`);
  const story = assertFullStoryContent(await response.json(), id);
  cache.set(id, story);
  return story;
}

export function clearFullStoryCache(): void {
  cache.clear();
}
