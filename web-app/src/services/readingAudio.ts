import { versionAudioUrl } from './audioAssets';

const CYRILLIC_SLUGS: Readonly<Record<string, string>> = {
  А: 'a', Б: 'b', В: 'v', Г: 'g', Д: 'd', Ђ: 'dj', Е: 'e', Ж: 'z',
  З: 'z', И: 'i', Ј: 'j', К: 'k', Л: 'l', Љ: 'lj', М: 'm', Н: 'n',
  Њ: 'nj', О: 'o', П: 'p', Р: 'r', С: 's', Т: 't', Ћ: 'c', У: 'u',
  Ф: 'f', Х: 'h', Ц: 'c', Ч: 'c', Џ: 'dz', Ш: 's'
};

function audioSlug(value: string): string {
  return Array.from(value.trim().toLocaleUpperCase('sr'))
    .map((character) => CYRILLIC_SLUGS[character] ?? character.toLocaleLowerCase('sr'))
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function readingRhymeAudio(roundId: string, part: 'prompt' | 'result'): string {
  return versionAudioUrl(`/audio/reading/rhyme-${roundId}-${part}.mp3`);
}

export function readingSyllableAudio(syllable: string): string {
  return versionAudioUrl(`/audio/reading/syllable-${audioSlug(syllable)}.mp3`);
}

export function readingWordAudio(word: string): string {
  return versionAudioUrl(`/audio/reading/word-${audioSlug(word)}.mp3`);
}

export function readingStorySentenceAudio(storyId: string, sentenceIndex: number): string {
  return versionAudioUrl(`/audio/reading/stories/${storyId}-${sentenceIndex + 1}.mp3`);
}

export function adventureLiteracyAudio(difficulty: number): string {
  const safeDifficulty = Math.min(6, Math.max(1, Math.round(difficulty)));
  return versionAudioUrl(`/audio/reading/adventure/literacy-${safeDifficulty}.mp3`);
}
