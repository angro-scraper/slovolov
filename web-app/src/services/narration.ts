import { prepareTextForVoice, selectSerbianVoice } from './serbianVoice';

export type NarrationSession = {
  pause: () => void;
  resume: () => void;
  stop: () => void;
};

type NarrationOptions = {
  enabled: boolean;
  audioKey?: string;
  startIndex?: number;
  onSentence?: (index: number) => void;
  onSource?: (source: 'recorded' | 'system' | 'unavailable') => void;
  onComplete?: () => void;
};

export function narrateSentences(sentences: string[], options: NarrationOptions): NarrationSession {
  let index = Math.max(0, Math.min(options.startIndex ?? 0, sentences.length - 1));
  let stopped = !options.enabled || sentences.length === 0;
  let currentAudio: HTMLAudioElement | null = null;
  let currentUtterance: SpeechSynthesisUtterance | null = null;

  const playCurrent = () => {
    if (stopped || index >= sentences.length) {
      if (!stopped) options.onComplete?.();
      return;
    }
    options.onSentence?.(index);
    let fallbackStarted = false;
    const fallbackToSystemVoice = () => {
      if (fallbackStarted || stopped) return;
      fallbackStarted = true;
      if (!window.speechSynthesis || typeof window.speechSynthesis.speak !== 'function') {
        stopped = true;
        options.onSource?.('unavailable');
        return;
      }
      const voice = selectSerbianVoice(window.speechSynthesis.getVoices?.() ?? []);
      if (!voice) {
        stopped = true;
        options.onSource?.('unavailable');
        return;
      }
      options.onSource?.('system');
      const utterance = new SpeechSynthesisUtterance(prepareTextForVoice(sentences[index], voice));
      currentUtterance = utterance;
      utterance.lang = voice.lang;
      utterance.voice = voice;
      utterance.rate = 0.72;
      utterance.pitch = 1.08;
      utterance.onend = () => {
        if (stopped) return;
        index += 1;
        playCurrent();
      };
      window.speechSynthesis.speak(utterance);
    };

    if (!options.audioKey) {
      fallbackToSystemVoice();
      return;
    }
    const audio = new Audio(`/audio/stories/${options.audioKey}-${index + 1}.mp3`);
    currentAudio = audio;
    audio.onended = () => {
      if (stopped) return;
      index += 1;
      playCurrent();
    };
    audio.onerror = fallbackToSystemVoice;
    void audio.play()
      .then(() => options.onSource?.('recorded'))
      .catch(fallbackToSystemVoice);
  };

  const session: NarrationSession = {
    pause: () => {
      currentAudio?.pause();
      window.speechSynthesis?.pause();
    },
    resume: () => {
      if (currentAudio && !currentAudio.ended) void currentAudio.play().catch(() => window.speechSynthesis?.resume());
      else window.speechSynthesis?.resume();
    },
    stop: () => {
      stopped = true;
      currentAudio?.pause();
      if (currentAudio) currentAudio.currentTime = 0;
      currentUtterance = null;
      window.speechSynthesis?.cancel();
    }
  };

  if (!stopped) playCurrent();
  return session;
}
