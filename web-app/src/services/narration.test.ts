import { beforeEach, describe, expect, it, vi } from 'vitest';
import { narrateSentences } from './narration';

describe('audio pripovedanje', () => {
  const speak = vi.fn();
  const pause = vi.fn();
  const resume = vi.fn();
  const cancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.SpeechSynthesisUtterance = class {
      text: string;
      lang = '';
      rate = 1;
      pitch = 1;
      onend: ((this: SpeechSynthesisUtterance, event: SpeechSynthesisEvent) => unknown) | null = null;
      constructor(text: string) { this.text = text; }
    } as typeof SpeechSynthesisUtterance;
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: { speak, pause, resume, cancel }
    });
  });

  it('čita rečenice redom i prijavljuje aktivnu rečenicu', () => {
    const active: number[] = [];
    const sources: string[] = [];
    const session = narrateSentences(['Прва.', 'Друга.'], {
      enabled: true,
      onSentence: (index) => active.push(index),
      onSource: (source) => sources.push(source)
    });

    expect(active).toEqual([0]);
    expect(sources).toEqual(['system']);
    expect(speak).toHaveBeenCalledTimes(1);
    const first = speak.mock.calls[0][0] as SpeechSynthesisUtterance;
    first.onend?.call(first, {} as SpeechSynthesisEvent);
    expect(active).toEqual([0, 1]);
    expect(speak).toHaveBeenCalledTimes(2);

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
