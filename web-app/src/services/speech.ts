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

function stopOtherVoices(): void {
  stopAllAppAudio();
  if (!activeAudio) return;
  activeAudio.pause();
  activeAudio.currentTime = 0;
  activeAudio = null;
  void releaseNativeAudioSession();
}

export function stopAppSpeech(): void {
  stopOtherVoices();
}

async function playSource(
  localSource: string,
  enabled: boolean
): Promise<boolean> {
  if (!enabled) return false;
  stopOtherVoices();
  const audio = new Audio(versionAudioUrl(localSource));
  activeAudio = audio;
  audio.currentTime = 0;
  audio.onended = () => {
    if (activeAudio === audio) activeAudio = null;
    void releaseNativeAudioSession();
  };
  try {
    // Ne čekamo native most pre play(): iOS zahteva da HTML audio počne u
    // istom korisničkom gestu. Posle starta ponovo potvrđujemo .spokenAudio
    // jer WKWebView ume da promeni AVAudioSession kategoriju.
    const nativeActivation = activateNativeAudioSession();
    await audio.play();
    await nativeActivation;
    await activateNativeAudioSession();
    return true;
  } catch {
    if (activeAudio === audio) activeAudio = null;
    return false;
  }
}

export async function speak(text: string, enabled = true): Promise<void> {
  if (!enabled) {
    stopOtherVoices();
    return;
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
  await playSource(localSource, enabled);
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
