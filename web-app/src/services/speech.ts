import { prepareTextForVoice, selectSerbianVoice } from './serbianVoice';
import { resolveLetterAudio } from './letterAudio';

const audioCache = new Map<string, HTMLAudioElement>();

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
  try {
    const audio = audioCache.get(localSource) ?? new Audio(localSource);
    audioCache.set(localSource, audio);
    await audio.play();
    return;
  } catch {
    // Lokalni snimak je poželjan; sistemski srpski glas je bezbedan offline fallback.
  }
  // Samostalna slova se nikada ne šalju sistemskom TTS-u: iOS može da ih
  // protumači kao engleske nazive slova (npr. J kao "džul").
  if (letterAudio) return;
  speakTextWithSystemVoice(text);
}
