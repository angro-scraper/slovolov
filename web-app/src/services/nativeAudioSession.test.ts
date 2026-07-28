import { beforeEach, describe, expect, it, vi } from 'vitest';

const activate = vi.fn();
const release = vi.fn();
const isNativePlatform = vi.fn();

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform },
  registerPlugin: () => ({ activate, release })
}));

describe('native Slovolov audio sesija', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    activate.mockResolvedValue({ granted: true });
    release.mockResolvedValue(undefined);
  });

  it('na native omotu traži ekskluzivni audio fokus', async () => {
    isNativePlatform.mockReturnValue(true);
    const { activateNativeAudioSession } = await import('./nativeAudioSession');

    await expect(activateNativeAudioSession()).resolves.toBe(true);
    expect(activate).toHaveBeenCalledOnce();
  });

  it('na webu ne poziva nepostojeći native most', async () => {
    isNativePlatform.mockReturnValue(false);
    const { activateNativeAudioSession, releaseNativeAudioSession } = await import(
      './nativeAudioSession'
    );

    await expect(activateNativeAudioSession()).resolves.toBe(true);
    await releaseNativeAudioSession();
    expect(activate).not.toHaveBeenCalled();
    expect(release).not.toHaveBeenCalled();
  });

  it('stari omot bez plugina ne blokira lokalni MP3', async () => {
    isNativePlatform.mockReturnValue(true);
    activate.mockRejectedValue(new Error('plugin nije instaliran'));
    const { activateNativeAudioSession } = await import('./nativeAudioSession');

    await expect(activateNativeAudioSession()).resolves.toBe(false);
  });
});
