import type { FullStoryContent } from './fullStoryLibrary';

export const STORY_AUDIO_CACHE = 'slovolov-story-audio-v2';

export type StoryDownloadProgress = {
  completed: number;
  total: number;
};

export async function downloadStoryForOffline(
  story: FullStoryContent,
  onProgress: (progress: StoryDownloadProgress) => void,
  signal?: AbortSignal
): Promise<void> {
  if (!story.audio.available) {
    throw new Error('Ova priča još nema kompletan audio-paket.');
  }
  if (!('caches' in globalThis)) {
    throw new Error('Ovaj uređaj ne podržava offline čuvanje audio-priča.');
  }

  const cache = await caches.open(STORY_AUDIO_CACHE);
  onProgress({ completed: 0, total: story.audio.sentenceCount });
  for (let index = 1; index <= story.audio.sentenceCount; index += 1) {
    const url = `/audio/stories/${story.audio.key}-${index}.mp3`;
    if (!(await cache.match(url))) {
      const response = await fetch(url, { signal });
      if (!response.ok) {
        throw new Error(`Audio nije preuzet (${response.status}), segment ${index}.`);
      }
      await cache.put(url, response.clone());
    }
    onProgress({ completed: index, total: story.audio.sentenceCount });
  }
}

export async function isStoryAvailableOffline(story: FullStoryContent): Promise<boolean> {
  if (!story.audio.available || !('caches' in globalThis)) return false;
  const cache = await caches.open(STORY_AUDIO_CACHE);
  for (let index = 1; index <= story.audio.sentenceCount; index += 1) {
    if (!(await cache.match(`/audio/stories/${story.audio.key}-${index}.mp3`))) return false;
  }
  return true;
}
