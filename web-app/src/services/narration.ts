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

function selectSerbianVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis?.getVoices?.() ?? [];
  const serbian = voices.filter((voice) => /^sr(?:-|_)/i.test(voice.lang));
  const preferredNames = ['sophie', 'google', 'microsoft', 'neural', 'premium'];

  return serbian.sort((left, right) => {
    const leftRank = preferredNames.findIndex((name) => left.name.toLowerCase().includes(name));
    const rightRank = preferredNames.findIndex((name) => right.name.toLowerCase().includes(name));
    const normalizedLeft = leftRank === -1 ? preferredNames.length : leftRank;
    const normalizedRight = rightRank === -1 ? preferredNames.length : rightRank;
    return normalizedLeft - normalizedRight;
  })[0];
}

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
      options.onSource?.('system');
      const utterance = new SpeechSynthesisUtterance(sentences[index]);
      currentUtterance = utterance;
      utterance.lang = 'sr-RS';
      const voice = selectSerbianVoice();
      if (voice) utterance.voice = voice;
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
