import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ColoringPad } from './ColoringPad';

const putImageData = vi.fn();

function enclosedPicture() {
  const width = 9;
  const height = 9;
  const data = new Uint8ClampedArray(width * height * 4).fill(255);
  for (let x = 2; x <= 6; x += 1) {
    for (const y of [2, 6]) {
      const offset = (y * width + x) * 4;
      data.fill(0, offset, offset + 3);
    }
  }
  for (let y = 2; y <= 6; y += 1) {
    for (const x of [2, 6]) {
      const offset = (y * width + x) * 4;
      data.fill(0, offset, offset + 3);
    }
  }
  for (let offset = 3; offset < data.length; offset += 4) data[offset] = 255;
  return { data, width, height } as ImageData;
}

describe('ColoringPad', () => {
  beforeEach(() => {
    localStorage.clear();
    putImageData.mockClear();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      scale: vi.fn(),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      getImageData: vi.fn(() => ({ marker: 'snapshot' })),
      putImageData
    } as unknown as CanvasRenderingContext2D);
    Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
      configurable: true,
      value: vi.fn(() => 'data:image/png;base64,crtez')
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('stvarno čuva crtež, prikazuje potvrdu i prijavljuje završetak roditelju', () => {
    const onSaved = vi.fn();
    render(<ColoringPad letter="А" onSaved={onSaved} />);

    fireEvent.click(screen.getByRole('button', { name: 'Sačuvaj crtež' }));

    expect(localStorage.getItem('slovolov-coloring-А')).toBe('data:image/png;base64,crtez');
    expect(screen.getByRole('status')).toHaveTextContent('Crtež je sačuvan');
    expect(onSaved).toHaveBeenCalledWith('А');
  });

  it('nudi tri debljine četkice i potvrđuje brisanje pre nego što ukloni crtež', () => {
    render(<ColoringPad letter="А" />);
    expect(screen.getByRole('button', { name: 'Tanka' })).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'Debela' }));
    expect(screen.getByRole('button', { name: 'Debela' })).toHaveAttribute('aria-pressed', 'true');

    localStorage.setItem('slovolov-coloring-А', 'data:image/png;base64,crtez');
    fireEvent.click(screen.getByRole('button', { name: 'Obriši' }));
    expect(screen.getByRole('group', { name: 'Potvrda brisanja' })).toBeInTheDocument();
    expect(localStorage.getItem('slovolov-coloring-А')).toBe('data:image/png;base64,crtez');
    fireEvent.click(screen.getByRole('button', { name: 'Obriši sve' }));
    expect(localStorage.getItem('slovolov-coloring-А')).toBeNull();
  });

  it('može da vrati prethodni potez', () => {
    render(<ColoringPad letter="А" />);
    const canvas = screen.getByLabelText('Bojanka za slovo А');
    Object.defineProperty(canvas, 'getBoundingClientRect', { value: () => ({ left: 0, top: 0, width: 200, height: 200 }) });
    fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.click(screen.getByRole('button', { name: 'Vrati potez' }));
    expect(screen.getByRole('status')).toHaveTextContent(/poslednji potez je vraćen/i);
    expect(putImageData).toHaveBeenCalledWith({ marker: 'snapshot' }, 0, 0);
  });

  it('popuni dodirnuti zatvoreni deo predmeta, a ne samo slobodni potez', async () => {
    vi.stubGlobal('Image', class {
      naturalWidth = 1536;
      naturalHeight = 1024;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) { this.onload?.(); }
    });
    const picture = enclosedPicture();
    const getImageData = vi.fn()
      .mockReturnValueOnce({ marker: 'snapshot' })
      .mockReturnValueOnce(picture);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      scale: vi.fn(), setTransform: vi.fn(), drawImage: vi.fn(), fillRect: vi.fn(), clearRect: vi.fn(),
      beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(), getImageData, putImageData
    } as unknown as CanvasRenderingContext2D);
    render(<ColoringPad letter="" objectName="Avion" requireDrawing templateIndex={0} illustrationImage="/atlas.png" />);
    const canvas = screen.getByLabelText('Bojanka za Avion');
    Object.defineProperty(canvas, 'width', { configurable: true, value: 9 });
    Object.defineProperty(canvas, 'height', { configurable: true, value: 9 });
    Object.defineProperty(canvas, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, width: 9, height: 9, right: 9, bottom: 9, x: 0, y: 0, toJSON: () => ({}) })
    });

    fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 4, clientY: 4 });
    fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 4, clientY: 4 });

    expect(putImageData).toHaveBeenCalledWith(picture, 0, 0);
    expect(screen.getByRole('status')).toHaveTextContent(/dodirni još neki deo/i);
    fireEvent.click(screen.getByRole('button', { name: 'Gotovo, obojio sam!' }));
    expect(screen.getByRole('status')).toHaveTextContent(/bravo! obojao si avion/i);
  });

  it('izoluje uvo od resa susedne ilustracije i ostavlja bezbedan prostor oko crteža', () => {
    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      setTransform: vi.fn(), fillRect: vi.fn(), drawImage
    } as unknown as CanvasRenderingContext2D);
    Object.defineProperty(HTMLCanvasElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 0, top: 0, width: 300, height: 500, right: 300, bottom: 500, x: 0, y: 0, toJSON: () => ({}) })
    });
    vi.stubGlobal('Image', class {
      naturalWidth = 1536;
      naturalHeight = 1024;
      onload: (() => void) | null = null;
      set src(_value: string) { this.onload?.(); }
    });

    render(<ColoringPad letter="" objectName="Uvo" templateIndex={5} templateCropInsetLeft={0.28} illustrationImage="/sheet.png" />);

    const [, sourceX, sourceY, sourceWidth, sourceHeight, targetX, targetY, targetWidth, targetHeight] = drawImage.mock.calls[0];
    expect([sourceX, sourceY, sourceWidth, sourceHeight]).toEqual([1167, 525, 356, 486]);
    expect(targetX).toBeGreaterThanOrEqual(30);
    expect(targetX + targetWidth).toBeLessThanOrEqual(270);
    expect(targetY).toBeGreaterThanOrEqual(20);
    expect(targetY + targetHeight).toBeLessThanOrEqual(350);
  });

  it('samostalni SVG šablon crta kao celu sliku umesto kao isečak', () => {
    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      setTransform: vi.fn(), fillRect: vi.fn(), drawImage
    } as unknown as CanvasRenderingContext2D);
    Object.defineProperty(HTMLCanvasElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 0, top: 0, width: 300, height: 500, right: 300, bottom: 500, x: 0, y: 0, toJSON: () => ({}) })
    });
    vi.stubGlobal('Image', class {
      naturalWidth = 120;
      naturalHeight = 150;
      onload: (() => void) | null = null;
      set src(_value: string) { this.onload?.(); }
    });

    render(<ColoringPad letter="" objectName="Balon" templateIndex={0} templateColumns={1} templateRows={1} illustrationImage="/balloon.svg" />);

    expect(drawImage).toHaveBeenCalledTimes(1);
    expect(drawImage.mock.calls[0]).toHaveLength(5);
  });

  it('čuva jagodu od prelaska linija susednog kita preko desne ivice ćelije', () => {
    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      setTransform: vi.fn(), fillRect: vi.fn(), drawImage
    } as unknown as CanvasRenderingContext2D);
    Object.defineProperty(HTMLCanvasElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 0, top: 0, width: 300, height: 500, right: 300, bottom: 500, x: 0, y: 0, toJSON: () => ({}) })
    });
    vi.stubGlobal('Image', class {
      naturalWidth = 1536;
      naturalHeight = 1024;
      onload: (() => void) | null = null;
      set src(_value: string) { this.onload?.(); }
    });

    render(<ColoringPad letter="" objectName="Jagoda" templateIndex={4} templateCropInsetRight={0.12} illustrationImage="/sheet.png" />);

    const [, sourceX, sourceY, sourceWidth, sourceHeight] = drawImage.mock.calls[0];
    expect([sourceX, sourceY, sourceWidth, sourceHeight]).toEqual([525, 525, 438, 486]);
  });

  it.each([
    [22, [1030, 774, 244, 244]],
    [25, [262, 1030, 244, 244]]
  ])('uzima celu izolovanu ćeliju atlasa za predmet %s', (index, expectedSource) => {
    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      setTransform: vi.fn(), fillRect: vi.fn(), drawImage
    } as unknown as CanvasRenderingContext2D);
    Object.defineProperty(HTMLCanvasElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 0, top: 0, width: 300, height: 500, right: 300, bottom: 500, x: 0, y: 0, toJSON: () => ({}) })
    });
    vi.stubGlobal('Image', class {
      naturalWidth = 1536;
      naturalHeight = 1280;
      onload: (() => void) | null = null;
      set src(_value: string) { this.onload?.(); }
    });

    render(<ColoringPad letter="" objectName="Predmet" templateIndex={Number(index)} templateColumns={6} templateRows={5} illustrationImage="/atlas.png" />);

    const [, sourceX, sourceY, sourceWidth, sourceHeight] = drawImage.mock.calls[0];
    expect([sourceX, sourceY, sourceWidth, sourceHeight]).toEqual(expectedSource);
  });
});
