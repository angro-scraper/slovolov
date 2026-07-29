import { describe, expect, it } from 'vitest';
import {
  createCreativeNarrationSources,
  deserializeCreativeBook,
  serializeCreativeBook
} from './creativeNarration';

describe('naracija Moje knjige', () => {
  const selection = {
    heroIndex: 1,
    placeIndex: 2,
    questIndex: 3,
    helperIndex: 0,
    endingIndex: 1
  };

  it('pravi četiri lokalna Sophie segmenta za tačne izbore deteta', () => {
    expect(createCreativeNarrationSources(selection)).toEqual([
      expect.stringContaining('/audio/creative/opening-h2-p3.mp3'),
      expect.stringContaining('/audio/creative/challenge-q4-p3.mp3'),
      expect.stringContaining('/audio/creative/solution-a1-q4.mp3'),
      expect.stringContaining('/audio/creative/ending-e2-h2.mp3')
    ]);
  });

  it('čuva izbor uz priču i ne prikazuje tehničke metapodatke detetu', () => {
    const saved = serializeCreativeBook('Наслов\n\nЦела прича.', selection);
    const restored = deserializeCreativeBook(saved);

    expect(restored.text).toBe('Наслов\n\nЦела прича.');
    expect(restored.selection).toEqual(selection);
    expect(restored.text).not.toContain('slovolov-creative');
  });

  it('bezbedno učitava ranije priče koje nemaju naratorske metapodatke', () => {
    expect(deserializeCreativeBook('Стара прича.')).toEqual({
      text: 'Стара прича.',
      selection: null
    });
  });
});
