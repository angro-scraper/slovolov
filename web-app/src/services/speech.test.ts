import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { speak, speakRecordedPrompt, stopAppSpeech } from './speech';
import * as nativeAudioSession from './nativeAudioSession';

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

    expect(created.at(-1)?.src).toBe('/audio/quiz/01.mp3?v=sr-sophie-lesson-v3-20260728');
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
    expect(created[1].src).toBe('/audio/quiz/02.mp3?v=sr-sophie-lesson-v3-20260728');
    expect(synthSpeak).not.toHaveBeenCalled();
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
});
