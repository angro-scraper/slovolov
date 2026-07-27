import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  installAudioIsolation,
  isAppAudioSuppressed,
  setAppAudioSuppressed
} from './audioIsolation';

describe('globalna izolacija Slovolov zvuka', () => {
  const phoneSpeak = vi.fn();
  const cancel = vi.fn();
  const originalPlay = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
  const originalPause = vi.fn();
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: { speak: phoneSpeak, cancel }
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      configurable: true,
      writable: true,
      value: originalPlay
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
      configurable: true,
      writable: true,
      value: originalPause
    });
  });

  afterEach(() => cleanup?.());

  it('blokira svaki pokušaj korišćenja glasa telefona', () => {
    cleanup = installAudioIsolation();

    window.speechSynthesis.speak({} as SpeechSynthesisUtterance);

    expect(phoneSpeak).not.toHaveBeenCalled();
    expect(cancel).toHaveBeenCalled();
  });

  it('novi snimak zaustavlja prethodni na Androidu i iOS-u', async () => {
    cleanup = installAudioIsolation();
    const first = new Audio('/audio/quiz/01.mp3');
    const second = new Audio('/audio/quiz/02.mp3');

    await first.play();
    await second.play();

    expect(originalPlay).toHaveBeenCalledTimes(2);
    expect(originalPause).toHaveBeenCalledWith();
    expect(first.currentTime).toBe(0);
    expect(cancel).toHaveBeenCalled();
  });

  it('sakrivanje aplikacije odmah gasi aktivni snimak', async () => {
    cleanup = installAudioIsolation();
    const audio = new Audio('/audio/quiz/03.mp3');
    await audio.play();
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden'
    });

    document.dispatchEvent(new Event('visibilitychange'));

    expect(originalPause).toHaveBeenCalled();
    expect(audio.currentTime).toBe(0);
  });

  it('utišava i zaustavlja naraciju dok je čitač ekrana aktivan', async () => {
    cleanup = installAudioIsolation();
    const audio = new Audio('/audio/quiz/04.mp3');
    await audio.play();

    setAppAudioSuppressed(true);

    expect(isAppAudioSuppressed()).toBe(true);
    expect(originalPause).toHaveBeenCalled();
    await expect(audio.play()).rejects.toMatchObject({ name: 'NotAllowedError' });
    expect(originalPlay).toHaveBeenCalledTimes(1);

    setAppAudioSuppressed(false);
    await audio.play();
    expect(originalPlay).toHaveBeenCalledTimes(2);
  });
});
