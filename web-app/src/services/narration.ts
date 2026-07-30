import { versionAudioUrl } from './audioAssets';
import {
  activateNativeAudioSession,
  releaseNativeAudioSession
} from './nativeAudioSession';

export type NarrationSession = {
  pause: () => void;
  resume: () => void;
  stop: () => void;
};

type NarrationOptions = {
  enabled: boolean;
  audioKey?: string;
  audioSources?: string[];
  startIndex?: number;
  onSentence?: (index: number) => void;
  onSource?: (source: 'recorded' | 'unavailable') => void;
  onComplete?: () => void;
};

export function narrateSentences(sentences: string[], options: NarrationOptions): NarrationSession {
  let index = Math.max(0, Math.min(options.startIndex ?? 0, sentences.length - 1));
  let stopped = !options.enabled || sentences.length === 0;
  let currentAudio: HTMLAudioElement | null = null;
  window.speechSynthesis?.cancel();

  const playCurrent = () => {
    if (stopped || index >= sentences.length) {
      if (!stopped) {
        void releaseNativeAudioSession();
        options.onComplete?.();
      }
      return;
    }
    options.onSentence?.(index);
    const markUnavailable = () => {
      if (stopped) return;
      stopped = true;
      currentAudio?.pause();
      void releaseNativeAudioSession();
      options.onSource?.('unavailable');
    };

    const explicitSource = options.audioSources?.[index];
    if (!options.audioKey && !explicitSource) {
      markUnavailable();
      return;
    }
    const audio = new Audio(explicitSource
      ? versionAudioUrl(explicitSource)
      : versionAudioUrl(`/audio/stories/${options.audioKey}-${index + 1}.mp3`));
    audio.preload = 'auto';
    currentAudio = audio;
    audio.onended = () => {
      if (stopped) return;
      index += 1;
      playCurrent();
    };
    audio.onerror = markUnavailable;
    // Prvi play mora ostati u istom korisničkom gestu na iOS-u. Native
    // aktivaciju pokrećemo paralelno, pa je potvrđujemo još jednom kada
    // WKWebView/Android WebView zaista započne reprodukciju.
    const nativeActivation = activateNativeAudioSession();
    void audio.play()
      .then(async () => {
        await nativeActivation;
        if (stopped || currentAudio !== audio) return;
        await activateNativeAudioSession();
        options.onSource?.('recorded');
      })
      .catch(markUnavailable);
  };

  const session: NarrationSession = {
    pause: () => {
      currentAudio?.pause();
    },
    resume: () => {
      if (currentAudio && !currentAudio.ended) {
        const nativeActivation = activateNativeAudioSession();
        void currentAudio.play()
          .then(async () => {
            await nativeActivation;
            if (!stopped) await activateNativeAudioSession();
          })
          .catch(() => {
            stopped = true;
            void releaseNativeAudioSession();
            options.onSource?.('unavailable');
          });
      }
    },
    stop: () => {
      stopped = true;
      currentAudio?.pause();
      if (currentAudio) currentAudio.currentTime = 0;
      window.speechSynthesis?.cancel();
      void releaseNativeAudioSession();
    }
  };

  if (!stopped) playCurrent();
  return session;
}
