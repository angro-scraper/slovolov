import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUDIO_ASSET_VERSION } from './audioAssets';
import {
  speak,
  speakAndWait,
  speakRecordedPrompt,
  speakRecordedPromptAndWait,
  stopAppSpeech
} from './speech';
import * as nativeAudioSession from './nativeAudioSession';
import * as nativeAudioPlayback from './nativeAudioPlayback';

describe('isključivo lokalni govor aplikacije', () => {
  const synthSpeak = vi.fn();
  const cancel = vi.fn();
  const play = vi.fn<() => Promise<void>>();
  const pause = vi.fn();
  const created: Array<{ src: string; currentTime: number; onended: (() => void) | null }> = [];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(nativeAudioSession, 'activateNativeAudioSession')
      .mockResolvedValue(true);
    vi.spyOn(nativeAudioSession, 'releaseNativeAudioSession')
      .mockResolvedValue();
    vi.spyOn(nativeAudioPlayback, 'startNativeAudioPlayback')
      .mockResolvedValue(null);
    created.length = 0;
    play.mockResolvedValue(undefined);
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: { speak: synthSpeak, cancel, getVoices: vi.fn(() => []) }
    });
    vi.stubGlobal('Audio', class {
      src: string;
      currentTime = 0;
      onended: (() => void) | null = null;
      play = play;
      pause = pause;
      constructor(src: string) {
        this.src = src;
        created.push(this);
      }
    });
  });

  afterEach(() => stopAppSpeech());

  it('snimljeno kviz pitanje nikada ne prosleđuje sistemskom glasu telefona', async () => {
    await speakRecordedPrompt(
      'Na slici je avion. Koje je prvo slovo?',
      '/audio/quiz/01.mp3'
    );

    expect(created.at(-1)?.src).toBe(`/audio/quiz/01.mp3?v=${AUDIO_ASSET_VERSION}`);
    expect(play).toHaveBeenCalledOnce();
    expect(cancel).toHaveBeenCalled();
    expect(synthSpeak).not.toHaveBeenCalled();
  });

  it('greška lokalnog snimka ne uključuje Android ili iOS TTS fallback', async () => {
    play.mockRejectedValueOnce(new Error('audio nije dostupan'));

    await speakRecordedPrompt('Pitanje', '/audio/quiz/90.mp3');

    expect(synthSpeak).not.toHaveBeenCalled();
  });

  it('novi zvuk prekida prethodni pre reprodukcije', async () => {
    await speakRecordedPrompt('Prvo', '/audio/quiz/01.mp3');
    await speakRecordedPrompt('Drugo', '/audio/quiz/02.mp3');

    expect(pause).toHaveBeenCalledOnce();
    expect(created[0].currentTime).toBe(0);
    expect(created[1].src).toBe(`/audio/quiz/02.mp3?v=${AUDIO_ASSET_VERSION}`);
    expect(synthSpeak).not.toHaveBeenCalled();
  });

  it('kviz čeka kraj jednog snimka i zastareli poziv ne može da nastavi da govori', async () => {
    const first = speakRecordedPromptAndWait('Prvo', '/audio/quiz/01.mp3');
    await vi.waitFor(() => expect(created).toHaveLength(1));

    const second = speakRecordedPromptAndWait('Drugo', '/audio/quiz/02.mp3');
    await expect(first).resolves.toBe(false);
    expect(pause).toHaveBeenCalled();
    expect(created[0].currentTime).toBe(0);

    let secondFinished = false;
    void second.then(() => {
      secondFinished = true;
    });
    await Promise.resolve();
    expect(secondFinished).toBe(false);

    await vi.waitFor(() => expect(nativeAudioSession.activateNativeAudioSession)
      .toHaveBeenCalledTimes(4));
    created[1].onended?.();
    await expect(second).resolves.toBe(true);
    expect(synthSpeak).not.toHaveBeenCalled();
  });

  it('pohvala može da završi pre nego što kviz pređe na sledeće pitanje', async () => {
    const finished = speakAndWait('Bravo! Tačan odgovor!');
    await vi.waitFor(() => expect(created).toHaveLength(1));
    await vi.waitFor(() => expect(nativeAudioSession.activateNativeAudioSession)
      .toHaveBeenCalledTimes(2));

    created[0].onended?.();

    await expect(finished).resolves.toBe(true);
  });

  it('izgovor slova koristi lokalni paket i nikada glas telefona', async () => {
    await speak('Ј');

    expect(created.at(-1)?.src).toContain('/audio/letters/11-lesson.mp3');
    expect(synthSpeak).not.toHaveBeenCalled();
  });

  it('poruka za zvezdicu i sledeće slovo koristi snimljeni srpski glas', async () => {
    await speak('Bravo! Dobio si zvezdicu. Idemo na sledeće slovo!');

    expect(created.at(-1)?.src).toContain('/audio/feedback/bravo-next-letter.mp3');
    expect(synthSpeak).not.toHaveBeenCalled();
  });

  it('poruka posle uspešnog pisanja koristi lokalni Bravo snimak', async () => {
    await speak('Bravo! Naučio si novo slovo!');

    expect(created.at(-1)?.src).toContain('/audio/feedback/bravo-new-letter.mp3');
    expect(synthSpeak).not.toHaveBeenCalled();
  });

  it('ponovo potvrđuje native audio sesiju nakon što WebView pokrene snimak', async () => {
    await speakRecordedPrompt('Pitanje', '/audio/quiz/01.mp3');

    expect(play).toHaveBeenCalledOnce();
    expect(nativeAudioSession.activateNativeAudioSession).toHaveBeenCalledTimes(2);
  });

  it('na Android uređaju sva lokalna pitanja pušta nativno bez WebView-a', async () => {
    const nativeHandle = {
      pause: vi.fn().mockResolvedValue(undefined),
      resume: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined)
    };
    vi.mocked(nativeAudioPlayback.startNativeAudioPlayback)
      .mockImplementationOnce(async (_source, callbacks) => {
        callbacks.onStarted();
        return nativeHandle;
      });

    await speakRecordedPrompt('Koje je prvo slovo?', '/audio/quiz/01.mp3');

    expect(nativeAudioPlayback.startNativeAudioPlayback)
      .toHaveBeenCalledWith('/audio/quiz/01.mp3', expect.any(Object));
    expect(created).toHaveLength(0);
    expect(play).not.toHaveBeenCalled();
    expect(synthSpeak).not.toHaveBeenCalled();
  });
});
