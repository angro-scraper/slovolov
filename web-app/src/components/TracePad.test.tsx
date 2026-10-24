import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TracePad } from './TracePad';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('TracePad olovka', () => {
  it('primenjuje izabranu boju i debljinu na novi potez', () => {
    const context = {
      scale: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      clearRect: vi.fn(),
      lineCap: 'round',
      lineJoin: 'round',
      strokeStyle: '#000',
      lineWidth: 1
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
    render(<TracePad letter="А" onComplete={() => undefined} />);

    fireEvent.click(screen.getByRole('button', { name: 'Boja Crvena' }));
    fireEvent.click(screen.getByRole('button', { name: 'Debela' }));
    const canvas = screen.getByLabelText('Platno za pisanje slova А');
    Object.defineProperty(canvas, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, width: 300, height: 400 })
    });
    fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 20, clientY: 30 });

    expect(context.strokeStyle).toBe('#ef4444');
    expect(context.lineWidth).toBe(28);
  });

  it('za malo slovo prikazuje mali glif umesto vektorskog vodiča velikog slova', () => {
    render(<TracePad letter="а" letterCase="lower" onComplete={() => undefined} />);

    expect(screen.getByTestId('guide-letter')).toHaveTextContent('а');
    expect(screen.getByTestId('guide-letter')).toHaveClass('guide-letter-lowercase');
    expect(screen.queryByTestId('vector-trace-guide')).not.toBeInTheDocument();
  });

  it('za veliko slovo koristi isti čitljiv tekstualni vodič kao i za malo slovo', () => {
    render(<TracePad letter="Б" onComplete={() => undefined} />);

    expect(screen.getByTestId('guide-letter')).toHaveTextContent('Б');
    expect(screen.queryByTestId('vector-trace-guide')).not.toBeInTheDocument();
  });

  it('ocenjuje crtanje malog slova pomoću istog malog glifa', () => {
    const context = {
      scale: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      clearRect: vi.fn(),
      fillText: vi.fn(),
      getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(300 * 400 * 4) })),
      lineCap: 'round',
      lineJoin: 'round',
      strokeStyle: '#000',
      lineWidth: 1,
      font: '' as string,
      textAlign: '' as CanvasTextAlign,
      textBaseline: '' as CanvasTextBaseline,
      fillStyle: '' as string
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
    render(<TracePad letter="а" letterCase="lower" onComplete={() => undefined} />);
    const canvas = screen.getByLabelText('Platno za pisanje slova а');
    Object.defineProperty(canvas, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, width: 300, height: 400 })
    });

    fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 20, clientY: 30 });
    fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 20, clientY: 30 });

    expect(context.fillText).toHaveBeenCalledWith('а', 150, 200);
  });
});
