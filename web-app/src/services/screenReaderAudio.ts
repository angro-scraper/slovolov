import { Capacitor } from '@capacitor/core';
import { ScreenReader } from '@capacitor/screen-reader';
import { setAppAudioSuppressed } from './audioIsolation';

type ListenerHandle = { remove: () => Promise<void> };
type ScreenReaderBridge = {
  isEnabled: () => Promise<{ value: boolean }>;
  addListener: (
    eventName: 'stateChange',
    listener: (state: { value: boolean }) => void
  ) => Promise<ListenerHandle>;
};

/**
 * Na Androidu i iOS-u prati stvarno stanje TalkBack/VoiceOver servisa.
 * Snimljeni glas aplikacije ne sme da bude ugašen kada je servis aktivan:
 * Android može da prijavi uključenu accessibility uslugu i kada TalkBack
 * trenutno ne govori, što je ranije ostavljalo celu aplikaciju bez zvuka.
 * Native audio sesija prekida drugi govorni kanal pri samoj reprodukciji.
 */
export async function monitorScreenReaderAudio(
  bridge: ScreenReaderBridge = ScreenReader,
  nativePlatform = Capacitor.isNativePlatform()
): Promise<() => Promise<void>> {
  if (!nativePlatform) {
    setAppAudioSuppressed(false);
    return async () => undefined;
  }

  try {
    await bridge.isEnabled();
    setAppAudioSuppressed(false);
    const listener = await bridge.addListener('stateChange', () => {
      window.speechSynthesis?.cancel();
      setAppAudioSuppressed(false);
    });

    return async () => {
      await listener.remove();
      setAppAudioSuppressed(false);
    };
  } catch {
    // Stari omot možda još nema novi native plugin. Aplikacija tada nastavlja
    // sa bezbednom globalnom izolacijom, bez uključivanja sistemskog TTS-a.
    setAppAudioSuppressed(false);
    return async () => undefined;
  }
}
