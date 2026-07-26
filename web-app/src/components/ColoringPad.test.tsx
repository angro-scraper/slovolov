import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ColoringPad } from './ColoringPad';

describe('ColoringPad', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      scale: vi.fn(),
      drawImage: vi.fn(),
      clearRect: vi.fn()
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
});
