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
  let startupTimer: ReturnType<typeof setTimeout> | null = null;
  window.speechSynthesis?.cancel();

  const clearStartupTimer = () => {
    if (startupTimer !== null) clearTimeout(startupTimer);
    startupTimer = null;
  };

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
    const primarySource = explicitSource
      ?? `/audio/stories/${options.audioKey}-${index + 1}.mp3`;
    const candidates = [primarySource];
    if (/\.mp3$/i.test(primarySource)) {
      candidates.push(primarySource.replace(/\.mp3$/i, '.ogg'));
    }

    const tryCandidate = (candidateIndex: number) => {
      if (stopped) return;
      if (candidateIndex >= candidates.length) {
        markUnavailable();
        return;
      }

      const audio = new Audio(versionAudioUrl(candidates[candidateIndex]));
      let failed = false;
      audio.preload = 'auto';
      currentAudio = audio;

      const tryFallback = () => {
        if (failed || stopped || currentAudio !== audio) return;
        failed = true;
        clearStartupTimer();
        audio.onerror = null;
        audio.onended = null;
        audio.pause();
        tryCandidate(candidateIndex + 1);
      };

      audio.onended = () => {
        if (stopped || currentAudio !== audio) return;
        clearStartupTimer();
        index += 1;
        playCurrent();
      };
      audio.onerror = tryFallback;

      // Ako stari WebView ne odbije format eksplicitno već ostavi play()
      // obećanje zauvek otvoreno, posle osam sekundi pokušavamo OGG kopiju
      // istog snimka umesto glasa telefona.
      startupTimer = setTimeout(tryFallback, 8_000);

      // Prvi play mora ostati u istom korisničkom gestu na iOS-u. Native
      // aktivaciju pokrećemo paralelno, pa je potvrđujemo još jednom kada
      // WKWebView/Android WebView zaista započne reprodukciju.
      const nativeActivation = activateNativeAudioSession();
      void audio.play()
        .then(async () => {
          clearStartupTimer();
          await nativeActivation;
          if (stopped || currentAudio !== audio) return;
          await activateNativeAudioSession();
          options.onSource?.('recorded');
        })
        .catch(tryFallback);
    };

    tryCandidate(0);
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
      clearStartupTimer();
      currentAudio?.pause();
      if (currentAudio) currentAudio.currentTime = 0;
      window.speechSynthesis?.cancel();
      void releaseNativeAudioSession();
    }
  };

  if (!stopped) playCurrent();
  return session;
}
