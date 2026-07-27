import { prepareTextForVoice, selectSerbianVoice } from './serbianVoice';
import { resolveLetterAudio } from './letterAudio';

const audioCache = new Map<string, HTMLAudioElement>();

async function playSource(
  text: string,
  localSource: string,
  enabled: boolean
): Promise<boolean> {
  if (!enabled) return false;
  try {
    const audio = audioCache.get(localSource) ?? new Audio(localSource);
    audioCache.set(localSource, audio);
    await audio.play();
    return true;
  } catch {
    return speakTextWithSystemVoice(text);
  }
}

export function speakTextWithSystemVoice(text: string): boolean {
  if (!('speechSynthesis' in window) || !window.speechSynthesis) return false;
  const voice = selectSerbianVoice(window.speechSynthesis.getVoices?.() ?? []);
  if (!voice) return false;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(prepareTextForVoice(text, voice));
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.rate = 0.72;
  utterance.pitch = 1.12;
  window.speechSynthesis.speak(utterance);
  return true;
}

export async function speak(text: string, enabled = true): Promise<void> {
  if (!enabled) return;
  const letterAudio = resolveLetterAudio(text);
  const key = text.toLocaleLowerCase('sr').replace(/\s+/g, '-');
  const localSource = letterAudio?.source ?? `/audio/${encodeURIComponent(key)}.mp3`;
  if (await playSource(text, localSource, enabled)) return;
  // Samostalna slova se nikada ne šalju sistemskom TTS-u: iOS može da ih
  // protumači kao engleske nazive slova (npr. J kao "džul").
  if (letterAudio) return;
  speakTextWithSystemVoice(text);
}

export async function speakRecordedPrompt(
  text: string,
  localSource: string,
  enabled = true
): Promise<void> {
  await playSource(text, localSource, enabled);
}
