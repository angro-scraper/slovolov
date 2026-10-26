import { describe, expect, it } from 'vitest';
import { fillColorRegion } from './coloring';

function outlinedBox(width = 9, height = 9) {
  const data = new Uint8ClampedArray(width * height * 4).fill(255);
  const setPixel = (x: number, y: number, value: number) => {
    const offset = (y * width + x) * 4;
    data[offset] = value;
    data[offset + 1] = value;
    data[offset + 2] = value;
    data[offset + 3] = 255;
  };
  for (let x = 2; x <= 6; x += 1) {
    setPixel(x, 2, 0);
    setPixel(x, 6, 0);
  }
  for (let y = 2; y <= 6; y += 1) {
    setPixel(2, y, 0);
    setPixel(6, y, 0);
  }
  return { data, width, height };
}

describe('fillColorRegion', () => {
  it('fills only a closed white region and preserves its black outline', () => {
    const image = outlinedBox();
    expect(fillColorRegion(image, 4, 4, '#ef4444')).toBe(true);
    const inside = (4 * image.width + 4) * 4;
    const outside = (1 * image.width + 1) * 4;
    const edge = (2 * image.width + 4) * 4;
    expect(Array.from(image.data.slice(inside, inside + 4))).toEqual([239, 68, 68, 255]);
    expect(Array.from(image.data.slice(outside, outside + 4))).toEqual([255, 255, 255, 255]);
    expect(Array.from(image.data.slice(edge, edge + 4))).toEqual([0, 0, 0, 255]);
  });

  it('refuses to fill the open white background or a point on the outline', () => {
    const image = outlinedBox();
    const before = image.data.slice();
    expect(fillColorRegion(image, 0, 0, '#22c55e')).toBe(false);
    expect(fillColorRegion(image, 2, 4, '#22c55e')).toBe(false);
    expect(image.data).toEqual(before);
  });

  it('ignores coordinates outside the canvas and invalid colors', () => {
    const image = outlinedBox();
    expect(fillColorRegion(image, -1, 3, '#3b82f6')).toBe(false);
    expect(fillColorRegion(image, 4, 4, 'purple')).toBe(false);
  });
});
