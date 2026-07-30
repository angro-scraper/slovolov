import { beforeEach, describe, expect, it, vi } from 'vitest';

const play = vi.fn();
const pausePlayback = vi.fn();
const resumePlayback = vi.fn();
const stopPlayback = vi.fn();
const isNativePlatform = vi.fn();
const getPlatform = vi.fn();
const listeners = new Map<string, (event: { token: string }) => void>();

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform, getPlatform },
  registerPlugin: () => ({
    play,
    pausePlayback,
    resumePlayback,
    stopPlayback,
    addListener: vi.fn(async (
      eventName: string,
      listener: (event: { token: string }) => void
    ) => {
      listeners.set(eventName, listener);
      return { remove: vi.fn().mockResolvedValue(undefined) };
    })
  })
}));

describe('Android MediaPlayer most', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listeners.clear();
    isNativePlatform.mockReturnValue(true);
    getPlatform.mockReturnValue('android');
    play.mockResolvedValue({ started: true });
    pausePlayback.mockResolvedValue(undefined);
    resumePlayback.mockResolvedValue(undefined);
    stopPlayback.mockResolvedValue(undefined);
  });

  it('pokreće snimak, prati završetak i prosleđuje kontrole', async () => {
    const onStarted = vi.fn();
    const onEnded = vi.fn();
    const onError = vi.fn();
    const { startNativeAudioPlayback } = await import('./nativeAudioPlayback');

    const handle = await startNativeAudioPlayback(
      'https://slovolov-download.onrender.com/audio/stories/test.mp3',
      { onStarted, onEnded, onError }
    );

    expect(handle).not.toBeNull();
    expect(onStarted).toHaveBeenCalledOnce();
    const token = play.mock.calls[0][0].token as string;
    listeners.get('playbackEnded')?.({ token });
    expect(onEnded).toHaveBeenCalledOnce();
    expect(onError).not.toHaveBeenCalled();
  });

  it('ne pokušava Android plejer u običnom browseru', async () => {
    isNativePlatform.mockReturnValue(false);
    const { startNativeAudioPlayback } = await import('./nativeAudioPlayback');

    await expect(startNativeAudioPlayback('https://example.test/a.mp3', {
      onStarted: vi.fn(),
      onEnded: vi.fn(),
      onError: vi.fn()
    })).resolves.toBeNull();
    expect(play).not.toHaveBeenCalled();
  });
});
