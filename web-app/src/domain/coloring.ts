export type PixelBuffer = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
};

const OUTLINE_LUMINANCE = 218;
const FILL_LUMINANCE = 238;

/** Fills one enclosed white region; open/background regions are left unchanged. */
export function fillColorRegion(
  image: PixelBuffer,
  startX: number,
  startY: number,
  color: string
): boolean {
  const { data, width, height } = image;
  const x = Math.floor(startX);
  const y = Math.floor(startY);
  if (x < 0 || y < 0 || x >= width || y >= height || !/^#[\da-f]{6}$/i.test(color)) return false;

  const start = (y * width + x) * 4;
  const luminanceAt = (offset: number) =>
    data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114;
  if (data[start + 3] < 16 || luminanceAt(start) < FILL_LUMINANCE) return false;

  const pixelCount = width * height;
  const visited = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  const startPixel = y * width + x;
  let read = 0;
  let write = 1;
  queue[0] = startPixel;
  visited[startPixel] = 1;

  while (read < write) {
    const pixel = queue[read++];
    const px = pixel % width;
    const py = (pixel / width) | 0;
    if (px === 0 || py === 0 || px === width - 1 || py === height - 1) return false;

    const neighbors = [
      py > 0 ? pixel - width : -1,
      px < width - 1 ? pixel + 1 : -1,
      py < height - 1 ? pixel + width : -1,
      px > 0 ? pixel - 1 : -1
    ];
    for (const neighbor of neighbors) {
      if (neighbor < 0) continue;
      if (visited[neighbor]) continue;
      const neighborOffset = neighbor * 4;
      if (data[neighborOffset + 3] < 16 || luminanceAt(neighborOffset) < OUTLINE_LUMINANCE) continue;
      visited[neighbor] = 1;
      queue[write++] = neighbor;
    }
  }

  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);
  for (let index = 0; index < write; index += 1) {
    const offset = queue[index] * 4;
    data[offset] = red;
    data[offset + 1] = green;
    data[offset + 2] = blue;
    data[offset + 3] = 255;
  }
  return write > 0;
}
