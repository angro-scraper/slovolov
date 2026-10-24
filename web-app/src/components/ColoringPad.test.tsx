import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ColoringPad } from './ColoringPad';

const putImageData = vi.fn();

describe('ColoringPad', () => {
  beforeEach(() => {
    localStorage.clear();
    putImageData.mockClear();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      scale: vi.fn(),
      drawImage: vi.fn(),
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
});
