import { versionAudioUrl } from './audioAssets';

export type CreativeSelection = {
  heroIndex: number;
  placeIndex: number;
  questIndex: number;
  helperIndex: number;
  endingIndex: number;
};

const METADATA_PREFIX = '[[slovolov-creative:v1:';

const safeIndex = (value: number) => Math.max(0, Math.min(3, Math.trunc(value))) + 1;

export function createCreativeNarrationSources(selection: CreativeSelection): string[] {
  const hero = safeIndex(selection.heroIndex);
  const place = safeIndex(selection.placeIndex);
  const quest = safeIndex(selection.questIndex);
  const helper = safeIndex(selection.helperIndex);
  const ending = safeIndex(selection.endingIndex);
  return [
    versionAudioUrl(`/audio/creative/opening-h${hero}-p${place}.mp3`),
    versionAudioUrl(`/audio/creative/challenge-q${quest}-p${place}.mp3`),
    versionAudioUrl(`/audio/creative/solution-a${helper}-q${quest}.mp3`),
    versionAudioUrl(`/audio/creative/ending-e${ending}-h${hero}.mp3`)
  ];
}

export function serializeCreativeBook(text: string, selection: CreativeSelection): string {
  const values = [
    selection.heroIndex,
    selection.placeIndex,
    selection.questIndex,
    selection.helperIndex,
    selection.endingIndex
  ].map((value) => Math.max(0, Math.min(3, Math.trunc(value))));
  return `${METADATA_PREFIX}${values.join(',')}]]\n${text.trim()}`;
}

export function deserializeCreativeBook(saved: string): {
  text: string;
  selection: CreativeSelection | null;
} {
  if (!saved.startsWith(METADATA_PREFIX)) return { text: saved, selection: null };
  const end = saved.indexOf(']]');
  if (end < 0) return { text: saved, selection: null };
  const values = saved.slice(METADATA_PREFIX.length, end).split(',').map(Number);
  if (values.length !== 5 || values.some((value) => !Number.isInteger(value) || value < 0 || value > 3)) {
    return { text: saved.slice(end + 2).trimStart(), selection: null };
  }
  return {
    text: saved.slice(end + 2).trimStart(),
    selection: {
      heroIndex: values[0],
      placeIndex: values[1],
      questIndex: values[2],
      helperIndex: values[3],
      endingIndex: values[4]
    }
  };
}
