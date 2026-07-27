import { beforeEach, describe, expect, it, vi } from 'vitest';
import { speakTextWithSystemVoice } from './speech';

describe('kratki srpski govor', () => {
  const synthSpeak = vi.fn();
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
      constructor(text: string) { this.text = text; }
    } as typeof SpeechSynthesisUtterance;
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: { speak: synthSpeak, cancel, getVoices }
    });
  });

  it('koristi konkretan srpski glas nezavisno od jezika telefona', () => {
    const russian = { name: 'Milena', lang: 'ru-RU' } as SpeechSynthesisVoice;
    const serbian = { name: 'Srbija', lang: 'sr-RS' } as SpeechSynthesisVoice;
    getVoices.mockReturnValueOnce([russian, serbian]);

    expect(speakTextWithSystemVoice('А као авион')).toBe(true);

    const utterance = synthSpeak.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(utterance.voice).toBe(serbian);
    expect(utterance.lang).toBe('sr-RS');
  });

  it('ne prosleđuje ćirilicu ruskom ili podrazumevanom glasu', () => {
    getVoices.mockReturnValueOnce([
      { name: 'Milena', lang: 'ru-RU' } as SpeechSynthesisVoice
    ]);

    expect(speakTextWithSystemVoice('А као авион')).toBe(false);
    expect(synthSpeak).not.toHaveBeenCalled();
  });

  it('latinicom prilagođava ćirilicu kada koristi hrvatski fallback', () => {
    const croatian = { name: 'Lana', lang: 'hr-HR' } as SpeechSynthesisVoice;
    getVoices.mockReturnValueOnce([croatian]);

    expect(speakTextWithSystemVoice('Љиљана и џем')).toBe(true);

    const utterance = synthSpeak.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(utterance.voice).toBe(croatian);
    expect(utterance.lang).toBe('hr-HR');
    expect(utterance.text).toBe('Ljiljana i džem');
  });
});
