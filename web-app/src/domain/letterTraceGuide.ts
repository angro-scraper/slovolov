import { CYRILLIC_ALPHABET, LATIN_ALPHABET } from './letters';
import { letterTraceGuides } from '../data/letterTraceGuides';

const guideIds = [
  'a', 'b', 'v', 'g', 'd', 'dj', 'e', 'zh', 'z', 'i', 'j', 'k', 'l', 'lj', 'm',
  'n', 'nj', 'o', 'p', 'r', 's', 't', 'tj', 'u', 'f', 'h', 'c', 'ch', 'dzh', 'sh'
] as const;

export type GuidePoint = readonly [number, number];
export type LetterGuideStrokes = readonly (readonly GuidePoint[])[];

export function getLetterTraceGuide(character: string, script: 'cyrillic' | 'latin'): LetterGuideStrokes | null {
  const normalized = character.toLocaleUpperCase('sr');
  const index = script === 'cyrillic'
    ? [...CYRILLIC_ALPHABET].indexOf(normalized)
    : LATIN_ALPHABET.findIndex((letter) => letter.toLocaleUpperCase('sr') === normalized);
  if (index < 0) return null;
  const guideId = guideIds[index];
  const guides = letterTraceGuides[script] as Record<string, LetterGuideStrokes>;
  return guides[guideId] ?? null;
}

export function traceGuideCoverage(
  strokes: readonly (readonly { x: number; y: number }[])[],
  guide: LetterGuideStrokes,
  width: number,
  height: number
) {
  const drawnSegments = strokes.flatMap((points) => points.slice(1).map((point, index) => [points[index], point] as const));
  const samples: { x: number; y: number }[] = [];
  for (const stroke of guide) {
    for (let index = 1; index < stroke.length; index += 1) {
      const [startX, startY] = stroke[index - 1];
      const [endX, endY] = stroke[index];
      for (let step = 0; step <= 16; step += 1) {
        const fraction = step / 16;
        samples.push({
          x: (startX + (endX - startX) * fraction) * width,
          y: (startY + (endY - startY) * fraction) * height
        });
      }
    }
  }
  if (!samples.length || !drawnSegments.length) return 0;
  const tolerance = Math.min(width, height) * 0.11;
  const covered = samples.filter((sample) => drawnSegments.some(([start, end]) => distanceToSegment(sample, start, end) <= tolerance));
  return covered.length / samples.length;
}

export function traceGuideHitRatio(points: { x: number; y: number }[], guide: LetterGuideStrokes, width: number, height: number) {
  if (!points.length) return 0;
  const segments = guide.flatMap((stroke) => stroke.slice(1).map((point, index) => [stroke[index], point] as const));
  if (!segments.length) return 0;
  const tolerance = Math.min(width, height) * 0.12;
  const hits = points.filter((point) => segments.some(([start, end]) => distanceToSegment(
    point,
    { x: start[0] * width, y: start[1] * height },
    { x: end[0] * width, y: end[1] * height }
  ) <= tolerance));
  return hits.length / points.length;
}

function distanceToSegment(point: { x: number; y: number }, start: { x: number; y: number }, end: { x: number; y: number }) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return Math.hypot(point.x - start.x, point.y - start.y);
  const fraction = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  return Math.hypot(point.x - (start.x + dx * fraction), point.y - (start.y + dy * fraction));
}
