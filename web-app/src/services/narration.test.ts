import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUDIO_ASSET_VERSION } from './audioAssets';
import * as nativeAudioSession from './nativeAudioSession';
import * as nativeAudioPlayback from './nativeAudioPlayback';
import { narrateSentences } from './narration';

describe('audio pripovedanje', () => {
  const speak = vi.fn();
  const pause = vi.fn();
  const resume = vi.fn();
  const cancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(nativeAudioSession, 'activateNativeAudioSession').mockResolvedValue(true);
    vi.spyOn(nativeAudioSession, 'releaseNativeAudioSession').mockResolvedValue();
    vi.spyOn(nativeAudioPlayback, 'startNativeAudioPlayback').mockResolvedValue(null);
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        speak,
        pause,
        resume,
        cancel,
        getVoices: vi.fn(() => [
          { name: 'Serbian phone voice', lang: 'sr-RS' } as SpeechSynthesisVoice
        ])
      }
    });
  });

  it('bez snimka prijavljuje nedostupan zvuk i ne koristi glas telefona', () => {
    const active: number[] = [];
    const sources: string[] = [];
    const session = narrateSentences(['Прва.', 'Друга.'], {
      enabled: true,
      onSentence: (index) => active.push(index),
      onSource: (source) => sources.push(source)
    });

    expect(active).toEqual([0]);
    expect(sources).toEqual(['unavailable']);
    expect(speak).not.toHaveBeenCalled();
    expect(cancel).toHaveBeenCalled();

    session.pause();
    session.resume();
    session.stop();
    expect(pause).not.toHaveBeenCalled();
    expect(resume).not.toHaveBeenCalled();
  });

  it('koristi isključivo snimljenu bajku iz aplikacije', async () => {
    const sources: string[] = [];
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValueOnce();

    narrateSentences(['Некада давно.'], {
      enabled: true,
      audioKey: 'ivica-i-marica-full',
      onSource: (source) => sources.push(source)
    });

    await vi.waitFor(() => expect(sources).toEqual(['recorded']));
    expect((play.mock.instances[0] as HTMLMediaElement).src)
      .toContain('/audio/stories/ivica-i-marica-full-1.mp3');
    expect((play.mock.instances[0] as HTMLMediaElement).src)
      .toContain(`v=${AUDIO_ASSET_VERSION}`);
    expect(nativeAudioSession.activateNativeAudioSession).toHaveBeenCalledTimes(2);
    expect(speak).not.toHaveBeenCalled();
  });

  it('može da spoji proverene naratorske segmente bez TTS fallback-a', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    const sources: string[] = [];

    narrateSentences(['Први део.', 'Други део.'], {
      enabled: true,
      audioSources: [
        '/audio/creative/part-1.mp3',
        '/audio/creative/part-2.mp3'
      ],
      onSource: (source) => sources.push(source)
    });

    await vi.waitFor(() => expect(sources).toEqual(['recorded']));
    expect((play.mock.instances[0] as HTMLMediaElement).src)
      .toContain('/audio/creative/part-1.mp3');
    expect(speak).not.toHaveBeenCalled();
  });

  it('greška snimka ne aktivira Android ili iOS TTS fallback', async () => {
    const sources: string[] = [];
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValue(new Error('nema snimka'));

    narrateSentences(['Некада давно.'], {
      enabled: true,
      audioKey: 'nedostaje',
      onSource: (source) => sources.push(source)
    });

    await vi.waitFor(() => expect(sources).toEqual(['unavailable']));
    expect(nativeAudioSession.releaseNativeAudioSession).toHaveBeenCalled();
    expect(speak).not.toHaveBeenCalled();
  });

  it('posle MP3 greške automatski koristi OGG kopiju istog naratora', async () => {
    const sources: string[] = [];
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play')
      .mockRejectedValueOnce(new Error('tablet ne dekodira mp3'))
      .mockResolvedValueOnce();

    narrateSentences(['Некада давно.'], {
      enabled: true,
      audioKey: 'ivica-i-marica-sazeta',
      onSource: (source) => sources.push(source)
    });

    await vi.waitFor(() => expect(sources).toEqual(['recorded']));
    expect(play).toHaveBeenCalledTimes(2);
    expect((play.mock.instances[0] as HTMLMediaElement).src).toContain('.mp3');
    expect((play.mock.instances[1] as HTMLMediaElement).src).toContain('.ogg');
    expect(speak).not.toHaveBeenCalled();
  });

  it('na Android tabletu posle HTML grešaka koristi nativni MediaPlayer', async () => {
    const sources: string[] = [];
    vi.spyOn(HTMLMediaElement.prototype, 'play')
      .mockRejectedValue(new Error('Android WebView ne reprodukuje audio'));
    const nativeHandle = {
      pause: vi.fn().mockResolvedValue(undefined),
      resume: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined)
    };
    const nativeStart = vi.spyOn(nativeAudioPlayback, 'startNativeAudioPlayback')
      .mockImplementation(async (_source, callbacks) => {
        callbacks.onStarted();
        return nativeHandle;
      });

    const session = narrateSentences(['Некада давно.'], {
      enabled: true,
      audioKey: 'ivica-i-marica-sazeta',
      onSource: (source) => sources.push(source)
    });

    await vi.waitFor(() => expect(sources).toEqual(['recorded']));
    expect(nativeStart).toHaveBeenCalledTimes(1);
    expect(nativeStart.mock.calls[0][0]).toContain(
      '/audio/stories/ivica-i-marica-sazeta-1.mp3'
    );
    expect(nativeStart.mock.calls[0][0]).toMatch(/^https?:\/\//);
    session.pause();
    session.resume();
    session.stop();
    expect(nativeHandle.pause).toHaveBeenCalled();
    expect(nativeHandle.resume).toHaveBeenCalled();
    expect(nativeHandle.stop).toHaveBeenCalled();
    expect(speak).not.toHaveBeenCalled();
  });

  it('ne pokreće zvuk kada je isključen', () => {
    narrateSentences(['Тишина.'], { enabled: false });
    expect(speak).not.toHaveBeenCalled();
  });
});
