import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VoicePractice } from './VoicePractice';

describe('privatna vežba izgovora', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('jasno kaže da mikrofon mora odobriti roditelj', () => {
    render(<VoicePractice enabled={false} phrase="МАМА" />);
    expect(screen.getByText(/roditelj može da uključi/i)).toBeVisible();
    expect(screen.queryByRole('button', { name: /Snimi moj glas/i })).not.toBeInTheDocument();
  });

  it('snima lokalno i nudi preslušavanje bez mrežnog zahteva', async () => {
    const stopTrack = vi.fn();
    const getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] });
    vi.stubGlobal('MediaRecorder', class {
      static isTypeSupported = () => true;
      state = 'inactive';
      ondataavailable?: (event: { data: Blob }) => void;
      onstop?: () => void;
      start() { this.state = 'recording'; }
      stop() {
        this.state = 'inactive';
        this.ondataavailable?.({ data: new Blob(['glas'], { type: 'audio/webm' }) });
        this.onstop?.();
      }
    });
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia }
    });
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:local-voice')
    });

    render(<VoicePractice enabled phrase="МАМА" />);
    fireEvent.click(screen.getByRole('button', { name: 'Snimi moj glas' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Zaustavi snimanje' })).toBeVisible());
    fireEvent.click(screen.getByRole('button', { name: 'Zaustavi snimanje' }));

    await waitFor(() => expect(screen.getByText(/Snimak je spreman samo na ovom uređaju/i)).toBeVisible());
    expect(screen.getByLabelText('Preslušaj svoj izgovor')).toHaveAttribute('src', 'blob:local-voice');
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(stopTrack).toHaveBeenCalled();
  });
});
