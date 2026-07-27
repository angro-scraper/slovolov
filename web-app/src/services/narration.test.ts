import { beforeEach, describe, expect, it, vi } from 'vitest';
import { narrateSentences } from './narration';

describe('audio pripovedanje', () => {
  const speak = vi.fn();
  const pause = vi.fn();
  const resume = vi.fn();
  const cancel = vi.fn();
  const getVoices = vi.fn<() => SpeechSynthesisVoice[]>(() => []);

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.SpeechSynthesisUtterance = class {
      text: string;
      lang = '';
      rate = 1;
      pitch = 1;
      voice: SpeechSynthesisVoice | null = null;
      onend: ((this: SpeechSynthesisUtterance, event: SpeechSynthesisEvent) => unknown) | null = null;
      constructor(text: string) { this.text = text; }
    } as typeof SpeechSynthesisUtterance;
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: { speak, pause, resume, cancel, getVoices }
    });
  });

  it('ne koristi podrazumevani glas uređaja kada srpski glas nije dostupan', () => {
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

    session.pause();
    session.resume();
    session.stop();
    expect(pause).toHaveBeenCalledOnce();
    expect(resume).toHaveBeenCalledOnce();
    expect(cancel).toHaveBeenCalled();
  });

  it('ne pokreće zvuk kada je isključen', () => {
    narrateSentences(['Тишина.'], { enabled: false });
    expect(speak).not.toHaveBeenCalled();
  });

  it('koristi sporiji srpski ritam prilagođen dečjoj audio-bajci', () => {
    getVoices.mockReturnValueOnce([
      { name: 'Serbian', lang: 'sr-RS' } as SpeechSynthesisVoice
    ]);
    narrateSentences(['Некада давно.'], { enabled: true });

    const utterance = speak.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(utterance.lang).toBe('sr-RS');
    expect(utterance.rate).toBeLessThanOrEqual(0.8);
    expect(utterance.pitch).toBeGreaterThanOrEqual(1);
  });

  it('bira kvalitetan srpski glas uređaja kada je dostupan', () => {
    const genericVoice = { name: 'Generic Serbian', lang: 'sr-RS' } as SpeechSynthesisVoice;
    const preferredVoice = { name: 'Microsoft Sophie Online (Natural)', lang: 'sr-RS' } as SpeechSynthesisVoice;
    getVoices.mockReturnValueOnce([genericVoice, preferredVoice]);

    narrateSentences(['Некада давно.'], { enabled: true });

    const utterance = speak.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(utterance.voice).toBe(preferredVoice);
  });

  it('nikada ne bira ruski glas za srpsku ćirilicu', () => {
    const sources: string[] = [];
    getVoices.mockReturnValueOnce([
      { name: 'Milena', lang: 'ru-RU' } as SpeechSynthesisVoice
    ]);

    narrateSentences(['Некада давно.'], {
      enabled: true,
      onSource: (source) => sources.push(source)
    });

    expect(sources).toEqual(['unavailable']);
    expect(speak).not.toHaveBeenCalled();
  });

  it('koristi hrvatski glas kao razumljiv južnoslovenski fallback', () => {
    const croatianVoice = { name: 'Lana', lang: 'hr-HR' } as SpeechSynthesisVoice;
    getVoices.mockReturnValueOnce([
      { name: 'Milena', lang: 'ru-RU' } as SpeechSynthesisVoice,
      croatianVoice
    ]);

    narrateSentences(['Некада давно.'], { enabled: true });

    const utterance = speak.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(utterance.voice).toBe(croatianVoice);
    expect(utterance.lang).toBe('hr-HR');
  });

  it('jasno prijavljuje da zvuk nije dostupan kada uređaj nema čitač', () => {
    const sources: string[] = [];
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: undefined });

    narrateSentences(['Тишина.'], {
      enabled: true,
      onSource: (source) => sources.push(source)
    });

    expect(sources).toEqual(['unavailable']);
  });
});
