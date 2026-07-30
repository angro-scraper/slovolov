import {
  Capacitor,
  registerPlugin,
  type PluginListenerHandle
} from '@capacitor/core';

type NativePlaybackResult = {
  started: boolean;
};

type NativePlaybackEvent = {
  token: string;
  message?: string;
};

type SlovolovAudioSessionPlugin = {
  play: (options: { url: string; token: string }) => Promise<NativePlaybackResult>;
  pausePlayback: () => Promise<void>;
  resumePlayback: () => Promise<void>;
  stopPlayback: () => Promise<void>;
  addListener: (
    eventName: 'playbackEnded' | 'playbackError',
    listener: (event: NativePlaybackEvent) => void
  ) => Promise<PluginListenerHandle>;
};

const NativeAudioPlayback = registerPlugin<SlovolovAudioSessionPlugin>(
  'SlovolovAudioSession'
);

export type NativeAudioPlaybackHandle = {
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
};

type NativePlaybackCallbacks = {
  onStarted: () => void;
  onEnded: () => void;
  onError: (message?: string) => void;
};

let playbackSequence = 0;

/**
 * Android MediaPlayer je poslednja linija odbrane za uređaje čiji WebView ne
 * može da reprodukuje isti lokalno spakovani MP3/OGG snimak. Stari omoti bez
 * metode `play` bezbedno vraćaju null i nastavljaju postojeći web tok.
 */
export async function startNativeAudioPlayback(
  source: string,
  callbacks: NativePlaybackCallbacks
): Promise<NativeAudioPlaybackHandle | null> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return null;
  }

  const token = `story-${Date.now()}-${++playbackSequence}`;
  let endedListener: PluginListenerHandle | null = null;
  let errorListener: PluginListenerHandle | null = null;
  let finished = false;

  const cleanup = async () => {
    await Promise.allSettled([
      endedListener?.remove(),
      errorListener?.remove()
    ]);
    endedListener = null;
    errorListener = null;
  };

  try {
    endedListener = await NativeAudioPlayback.addListener(
      'playbackEnded',
      (event) => {
        if (event.token !== token || finished) return;
        finished = true;
        void cleanup();
        callbacks.onEnded();
      }
    );
    errorListener = await NativeAudioPlayback.addListener(
      'playbackError',
      (event) => {
        if (event.token !== token || finished) return;
        finished = true;
        void cleanup();
        callbacks.onError(event.message);
      }
    );

    const result = await NativeAudioPlayback.play({ url: source, token });
    if (!result.started) {
      finished = true;
      await cleanup();
      return null;
    }
    callbacks.onStarted();
  } catch {
    finished = true;
    await cleanup();
    return null;
  }

  return {
    pause: async () => {
      if (!finished) await NativeAudioPlayback.pausePlayback();
    },
    resume: async () => {
      if (!finished) await NativeAudioPlayback.resumePlayback();
    },
    stop: async () => {
      if (finished) return;
      finished = true;
      await NativeAudioPlayback.stopPlayback();
      await cleanup();
    }
  };
}
