import { Capacitor, registerPlugin } from '@capacitor/core';

type AudioSessionResult = {
  granted: boolean;
};

type SlovolovAudioSessionPlugin = {
  activate: () => Promise<AudioSessionResult>;
  release: () => Promise<void>;
};

const NativeAudioSession = registerPlugin<SlovolovAudioSessionPlugin>(
  'SlovolovAudioSession'
);

/**
 * Native omot potvrđuje audio režim uz svaku reprodukciju. Stari omoti možda
 * još nemaju plugin, pa lokalni MP3 mora da nastavi da radi i tada.
 */
export async function activateNativeAudioSession(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;
  try {
    const result = await NativeAudioSession.activate();
    return result.granted;
  } catch {
    return false;
  }
}

export async function releaseNativeAudioSession(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await NativeAudioSession.release();
  } catch {
    // Stari native omot nema ovaj plugin.
  }
}
