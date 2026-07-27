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
  window.speechSynthesis?.cancel();

  const playCurrent = () => {
    if (stopped || index >= sentences.length) {
      if (!stopped) options.onComplete?.();
      return;
    }
    options.onSentence?.(index);
    const markUnavailable = () => {
      if (stopped) return;
      stopped = true;
      options.onSource?.('unavailable');
    };

    if (!options.audioKey) {
      markUnavailable();
      return;
    }
    const audio = new Audio(`/audio/stories/${options.audioKey}-${index + 1}.mp3`);
    currentAudio = audio;
    audio.onended = () => {
      if (stopped) return;
      index += 1;
      playCurrent();
    };
    audio.onerror = markUnavailable;
    void audio.play()
      .then(() => options.onSource?.('recorded'))
      .catch(markUnavailable);
  };

  const session: NarrationSession = {
    pause: () => {
      currentAudio?.pause();
    },
    resume: () => {
      if (currentAudio && !currentAudio.ended) void currentAudio.play().catch(() => {
        stopped = true;
        options.onSource?.('unavailable');
      });
    },
    stop: () => {
      stopped = true;
      currentAudio?.pause();
      if (currentAudio) currentAudio.currentTime = 0;
      window.speechSynthesis?.cancel();
    }
  };

  if (!stopped) playCurrent();
  return session;
}
