type Cleanup = () => void;

let appAudioSuppressed = false;
let stopInstalledAudio: (() => void) | null = null;

/**
 * VoiceOver i TalkBack ne smeju da budu programski ugašeni. Kada je neki od
 * njih aktivan, Slovolov zato utišava samo svoj naratorski kanal.
 */
export function setAppAudioSuppressed(suppressed: boolean): void {
  appAudioSuppressed = suppressed;
  if (suppressed) stopInstalledAudio?.();
}

export function isAppAudioSuppressed(): boolean {
  return appAudioSuppressed;
}

export function stopAllAppAudio(): void {
  window.speechSynthesis?.cancel();
  stopInstalledAudio?.();
}

/**
 * Jedan zvučni kanal za celu aplikaciju.
 *
 * iOS i Android WebView mogu istovremeno da puste više HTMLAudioElement
 * instanci, a sistemski TTS može ostati aktivan iz prethodnog ekrana.
 * Slovolov zato globalno dozvoljava samo poslednji lokalni snimak i potpuno
 * blokira Web Speech sintezu glasa telefona.
 */
export function installAudioIsolation(): Cleanup {
  const mediaPrototype = HTMLMediaElement.prototype;
  const originalPlay = mediaPrototype.play;
  const originalPause = mediaPrototype.pause;
  const synthesis = window.speechSynthesis;
  const originalSpeak = synthesis?.speak;
  let activeMedia: HTMLMediaElement | null = null;

  const stopActive = () => {
    synthesis?.cancel();
    if (!activeMedia) return;
    const previous = activeMedia;
    activeMedia = null;
    originalPause.call(previous);
    try {
      previous.currentTime = 0;
    } catch {
      // Neki iOS media elementi ne dozvoljavaju seek pre učitavanja metadata.
    }
  };
  stopInstalledAudio = stopActive;

  mediaPrototype.play = function isolatedPlay(...args: Parameters<HTMLMediaElement['play']>) {
    synthesis?.cancel();
    if (appAudioSuppressed) {
      stopActive();
      return Promise.reject(
        new DOMException('Naracija je utišana dok je čitač ekrana aktivan.', 'NotAllowedError')
      );
    }
    if (activeMedia && activeMedia !== this) stopActive();
    activeMedia = this;
    return originalPlay.apply(this, args);
  };

  mediaPrototype.pause = function isolatedPause(...args: Parameters<HTMLMediaElement['pause']>) {
    if (activeMedia === this) activeMedia = null;
    return originalPause.apply(this, args);
  };

  if (synthesis) {
    synthesis.speak = () => {
      synthesis.cancel();
    };
  }

  const stopWhenHidden = () => {
    if (document.visibilityState === 'hidden') stopActive();
  };
  window.addEventListener('pagehide', stopActive);
  document.addEventListener('visibilitychange', stopWhenHidden);
  stopActive();

  return () => {
    stopActive();
    if (stopInstalledAudio === stopActive) stopInstalledAudio = null;
    appAudioSuppressed = false;
    mediaPrototype.play = originalPlay;
    mediaPrototype.pause = originalPause;
    if (synthesis) synthesis.speak = originalSpeak;
    window.removeEventListener('pagehide', stopActive);
    document.removeEventListener('visibilitychange', stopWhenHidden);
  };
}
