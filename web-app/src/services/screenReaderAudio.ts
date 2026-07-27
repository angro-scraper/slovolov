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
 * Web nema pouzdan API za ovu proveru, pa tamo ostaje globalna izolacija
 * jednog lokalnog audio kanala.
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
    const initialState = await bridge.isEnabled();
    setAppAudioSuppressed(initialState.value);
    const listener = await bridge.addListener('stateChange', ({ value }) => {
      setAppAudioSuppressed(value);
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
