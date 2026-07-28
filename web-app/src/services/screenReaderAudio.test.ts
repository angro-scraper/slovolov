import { afterEach, describe, expect, it, vi } from 'vitest';
import { isAppAudioSuppressed, setAppAudioSuppressed } from './audioIsolation';
import { monitorScreenReaderAudio } from './screenReaderAudio';

describe('native screen reader audio kontrola', () => {
  afterEach(() => setAppAudioSuppressed(false));

  it('na webu ne pokušava native proveru', async () => {
    const bridge = {
      isEnabled: vi.fn(),
      addListener: vi.fn()
    };

    const cleanup = await monitorScreenReaderAudio(bridge, false);

    expect(bridge.isEnabled).not.toHaveBeenCalled();
    expect(isAppAudioSuppressed()).toBe(false);
    await cleanup();
  });

  it('ne utišava snimke aplikacije kada je VoiceOver ili TalkBack aktivan', async () => {
    let stateListener: ((state: { value: boolean }) => void) | undefined;
    const remove = vi.fn().mockResolvedValue(undefined);
    const bridge = {
      isEnabled: vi.fn().mockResolvedValue({ value: true }),
      addListener: vi.fn().mockImplementation(
        async (_eventName: 'stateChange', listener: (state: { value: boolean }) => void) => {
          stateListener = listener;
          return { remove };
        }
      )
    };

    const cleanup = await monitorScreenReaderAudio(bridge, true);

    expect(isAppAudioSuppressed()).toBe(false);
    stateListener?.({ value: false });
    expect(isAppAudioSuppressed()).toBe(false);
    stateListener?.({ value: true });
    expect(isAppAudioSuppressed()).toBe(false);

    await cleanup();
    expect(remove).toHaveBeenCalledOnce();
    expect(isAppAudioSuppressed()).toBe(false);
  });

  it('bezbedno nastavlja kada stari omot još nema plugin', async () => {
    const bridge = {
      isEnabled: vi.fn().mockRejectedValue(new Error('plugin nije instaliran')),
      addListener: vi.fn()
    };

    await monitorScreenReaderAudio(bridge, true);

    expect(isAppAudioSuppressed()).toBe(false);
    expect(bridge.addListener).not.toHaveBeenCalled();
  });
});
