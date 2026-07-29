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

let activeAudio: HTMLAudioElement | null = null;
let activeCompletion: ((completed: boolean) => void) | null = null;
let playbackGeneration = 0;

function stopOtherVoices(): void {
  playbackGeneration += 1;
  const previousAudio = activeAudio;
  const previousCompletion = activeCompletion;
  activeAudio = null;
  activeCompletion = null;
  stopAllAppAudio();
  if (previousAudio) {
    previousAudio.pause();
    previousAudio.currentTime = 0;
  }
  previousCompletion?.(false);
  void releaseNativeAudioSession();
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
  stopOtherVoices();
  const generation = playbackGeneration;
  const audio = new Audio(versionAudioUrl(localSource));
  activeAudio = audio;
  audio.currentTime = 0;
  let finish: ((completed: boolean) => void) | null = null;
  const completion = waitForEnd
    ? new Promise<boolean>((resolve) => {
        finish = resolve;
        activeCompletion = resolve;
      })
    : null;

  const finishPlayback = (completed: boolean) => {
    if (activeAudio === audio) {
      activeAudio = null;
      activeCompletion = null;
    }
    finish?.(completed);
    finish = null;
    void releaseNativeAudioSession();
  };
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
    if (generation !== playbackGeneration || activeAudio !== audio) {
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
