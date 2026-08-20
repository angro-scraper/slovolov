import { resolveLetterAudio } from './letterAudio';
import { resolveFeedbackAudio } from './feedbackAudio';
import { resolveNumberAudio } from './numberAudio';
import { resolveWordAudio } from './wordAudio';
import { versionAudioUrl } from './audioAssets';
import { stopAllAppAudio } from './audioIsolation';
import {
  activateNativeAudioSession,
  releaseNativeAudioSession
} from './nativeAudioSession';
import {
  startNativeAudioPlayback,
  type NativeAudioPlaybackHandle
} from './nativeAudioPlayback';

let activeAudio: HTMLAudioElement | null = null;
let activeNativePlayback: NativeAudioPlaybackHandle | null = null;
let activeCompletion: ((completed: boolean) => void) | null = null;
let playbackGeneration = 0;

function stopOtherVoices(releaseSession = true): void {
  playbackGeneration += 1;
  const previousAudio = activeAudio;
  const previousNativePlayback = activeNativePlayback;
  const previousCompletion = activeCompletion;
  activeAudio = null;
  activeNativePlayback = null;
  activeCompletion = null;
  stopAllAppAudio();
  if (previousAudio) {
    previousAudio.pause();
    previousAudio.currentTime = 0;
  }
  void previousNativePlayback?.stop();
  previousCompletion?.(false);
  if (releaseSession) {
    void releaseNativeAudioSession();
  }
}

export function stopAppSpeech(): void {
  stopOtherVoices();
}

async function playSource(
  localSource: string,
  enabled: boolean,
  waitForEnd = false
): Promise<boolean> {
  if (!enabled) {
    stopOtherVoices();
    return false;
  }
  // Novi snimak nasleđuje istu native sesiju. Ne puštamo zastareli release
  // između dva pitanja jer bi time TalkBack/VoiceOver ponovo dobio WebView.
  stopOtherVoices(false);
  const generation = playbackGeneration;
  let finish: ((completed: boolean) => void) | null = null;
  const completion = waitForEnd
    ? new Promise<boolean>((resolve) => {
        finish = resolve;
        activeCompletion = resolve;
      })
    : null;

  let finished = false;
  const finishPlayback = (completed: boolean) => {
    if (finished) return;
    finished = true;
    const isCurrent = generation === playbackGeneration;
    if (isCurrent) {
      activeAudio = null;
      activeNativePlayback = null;
      activeCompletion = null;
    }
    finish?.(completed);
    finish = null;
    if (isCurrent) {
      void releaseNativeAudioSession();
    }
  };

  // Android WebView nije pouzdan na svim telefonima i tabletima, naročito
  // kada je aplikacija instalirana kao Capacitor omot. Zato Android lokalne
  // snimke prvo pušta kroz MediaPlayer koji čita direktno iz APK assets-a.
  // U browseru i na iOS-u ovaj poziv vraća null i ostaje postojeći HTML tok.
  const nativePlayback = await startNativeAudioPlayback(localSource, {
    onStarted: () => undefined,
    onEnded: () => finishPlayback(true),
    onError: () => finishPlayback(false)
  });
  if (nativePlayback) {
    if (generation !== playbackGeneration || finished) {
      await nativePlayback.stop();
      finishPlayback(false);
      return false;
    }
    activeNativePlayback = nativePlayback;
    return completion ?? true;
  }

  const audio = new Audio(versionAudioUrl(localSource));
  activeAudio = audio;
  audio.preload = 'auto';
  audio.currentTime = 0;
  audio.onended = () => {
    finishPlayback(true);
  };
  audio.onerror = () => {
    finishPlayback(false);
  };
  try {
    // Ne čekamo native most pre play(): iOS zahteva da HTML audio počne u
    // istom korisničkom gestu. Posle starta ponovo potvrđujemo .spokenAudio
    // jer WKWebView ume da promeni AVAudioSession kategoriju.
    const nativeActivation = activateNativeAudioSession();
    await audio.play();
    await nativeActivation;
    if (generation !== playbackGeneration || activeAudio !== audio || finished) {
      audio.pause();
      audio.currentTime = 0;
      finishPlayback(false);
      return false;
    }
    await activateNativeAudioSession();
    return completion ?? true;
  } catch {
    finishPlayback(false);
    return false;
  }
}

async function speakLocal(
  text: string,
  enabled: boolean,
  waitForEnd: boolean
): Promise<boolean> {
  if (!enabled) {
    stopOtherVoices();
    return false;
  }
  const letterAudio = resolveLetterAudio(text);
  const feedbackAudio = resolveFeedbackAudio(text);
  const numberAudio = resolveNumberAudio(text);
  const wordAudio = resolveWordAudio(text);
  const key = text.toLocaleLowerCase('sr').replace(/\s+/g, '-');
  const localSource = letterAudio?.source
    ?? feedbackAudio
    ?? numberAudio
    ?? wordAudio
    ?? versionAudioUrl(`/audio/${encodeURIComponent(key)}.mp3`);
  // Aplikacija nikada ne prelazi na glas telefona. Android/iOS sistemski TTS
  // ume da izgovori srpska slova drugim jezikom i da se preklopi sa snimkom.
  return playSource(localSource, enabled, waitForEnd);
}

export async function speak(text: string, enabled = true): Promise<void> {
  await speakLocal(text, enabled, false);
}

export async function speakAndWait(
  text: string,
  enabled = true
): Promise<boolean> {
  return speakLocal(text, enabled, true);
}

export async function speakRecordedPrompt(
  text: string,
  localSource: string,
  enabled = true
): Promise<void> {
  void text;
  if (!enabled) {
    stopOtherVoices();
    return;
  }
  await playSource(localSource, enabled);
}

export async function speakRecordedPromptAndWait(
  text: string,
  localSource: string,
  enabled = true
): Promise<boolean> {
  void text;
  if (!enabled) {
    stopOtherVoices();
    return false;
  }
  return playSource(localSource, enabled, true);
}
