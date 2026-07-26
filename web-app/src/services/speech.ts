const audioCache = new Map<string, HTMLAudioElement>();

export async function speak(text: string, enabled = true): Promise<void> {
  if (!enabled) return;
  const key = text.toLocaleLowerCase('sr').replace(/\s+/g, '-');
  const localSource = `/audio/${encodeURIComponent(key)}.mp3`;
  try {
    const audio = audioCache.get(localSource) ?? new Audio(localSource);
    audioCache.set(localSource, audio);
    await audio.play();
    return;
  } catch {
    // Lokalni snimak je poželjan; sistemski srpski glas je bezbedan offline fallback.
  }
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'sr-RS';
  utterance.rate = 0.72;
  utterance.pitch = 1.12;
  window.speechSynthesis.speak(utterance);
}
