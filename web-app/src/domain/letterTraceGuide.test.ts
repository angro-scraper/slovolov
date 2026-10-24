import { describe, expect, it } from 'vitest';
import { letterTraceGuides } from '../data/letterTraceGuides';
import { CYRILLIC_ALPHABET, LATIN_ALPHABET } from './letters';
import { getLetterTraceGuide, traceGuideCoverage, traceGuideHitRatio } from './letterTraceGuide';

describe('stare vektorske putanje za pisanje slova', () => {
  it('ima posebnu putanju za svih 30 slova na ćirilici i latinici', () => {
    expect(Object.keys(letterTraceGuides.cyrillic)).toHaveLength(30);
    expect(Object.keys(letterTraceGuides.latin)).toHaveLength(30);
    expect(getLetterTraceGuide('Љ', 'cyrillic')).not.toBeNull();
    expect(getLetterTraceGuide('Lj', 'latin')).not.toBeNull();
    expect(getLetterTraceGuide('Џ', 'cyrillic')).not.toBeNull();
    expect(getLetterTraceGuide('Dž', 'latin')).not.toBeNull();
    expect([...CYRILLIC_ALPHABET]).toHaveLength(30);
    expect(LATIN_ALPHABET).toHaveLength(30);
  });

  it('prepoznaje crtanje preko vodiča i odbija trag van putanje', () => {
    const guide = getLetterTraceGuide('A', 'latin');
    expect(guide).not.toBeNull();
    const guidedPoints = guide!.flatMap((stroke) => stroke.map(([x, y]) => ({ x: x * 300, y: y * 300 })));
    const offGuide = Array.from({ length: guidedPoints.length + 4 }, (_, index) => ({ x: 8 + index, y: 286 - index }));
    expect(traceGuideCoverage([guidedPoints], guide!, 300, 300)).toBeGreaterThan(0.8);
    expect(traceGuideHitRatio(guidedPoints, guide!, 300, 300)).toBe(1);
    expect(traceGuideHitRatio(offGuide, guide!, 300, 300)).toBeLessThan(0.5);
  });
});
