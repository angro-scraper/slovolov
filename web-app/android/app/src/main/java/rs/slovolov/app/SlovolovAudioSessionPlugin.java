package rs.slovolov.app;

import android.content.Context;
import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Build;
import android.view.View;
import android.view.accessibility.AccessibilityManager;

import java.io.IOException;
import java.util.concurrent.atomic.AtomicBoolean;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Reprodukuje lokalne Slovolov snimke preko Android MediaPlayer-a.
 *
 * AssetFileDescriptor mora da ostane otvoren dok prepareAsync ne završi. Neki
 * Android 13/tablet MediaPlayer-i ne mogu pouzdano da čitaju descriptor koji je
 * zatvoren odmah nakon setDataSource, što je ranije ostavljalo aplikaciju bez
 * zvuka. Audio fokus je vezan samo za aktivnu reprodukciju, ne za životni vek
 * cele aktivnosti.
 */
@CapacitorPlugin(name = "SlovolovAudioSession")
public class SlovolovAudioSessionPlugin extends Plugin {
    private MediaPlayer mediaPlayer;
    private String playbackToken;
    private AssetFileDescriptor activeAssetDescriptor;
    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;
    private boolean resumeAfterFocusGain;

    private final AudioManager.OnAudioFocusChangeListener audioFocusListener = focusChange -> {
        MediaPlayer player = mediaPlayer;
        if (player == null) return;
        try {
            if (focusChange == AudioManager.AUDIOFOCUS_LOSS) {
                resumeAfterFocusGain = false;
                stopAndReleasePlayer();
            } else if (focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT
                    || focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK) {
                resumeAfterFocusGain = player.isPlaying();
                if (player.isPlaying()) player.pause();
            } else if (focusChange == AudioManager.AUDIOFOCUS_GAIN && resumeAfterFocusGain) {
                resumeAfterFocusGain = false;
                player.start();
            }
        } catch (IllegalStateException ignored) {
            // Reprodukcija je u međuvremenu završena ili zaustavljena.
        }
    };

    @PluginMethod
    public void activate(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            prepareAudioEnvironment();
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
        });
    }

    @PluginMethod
    public void release(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            getBridge().getWebView().setImportantForAccessibility(
                View.IMPORTANT_FOR_ACCESSIBILITY_YES
            );
            call.resolve();
        });
    }

    @PluginMethod
    public void play(PluginCall call) {
        String url = call.getString("url");
        String token = call.getString("token");
        if (url == null || token == null) {
            call.reject("Nedostaje URL ili token audio snimka.");
            return;
        }
        Uri uri = Uri.parse(url);

        getActivity().runOnUiThread(() -> {
            prepareAudioEnvironment();
            stopAndReleasePlayer();
            if (!requestPlaybackAudioFocus()) {
                JSObject result = new JSObject();
                result.put("started", false);
                call.resolve(result);
                return;
            }

            playbackToken = token;
            MediaPlayer player = new MediaPlayer();
            AtomicBoolean started = new AtomicBoolean(false);
            mediaPlayer = player;
            player.setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build());
            player.setOnPreparedListener(prepared -> {
                if (mediaPlayer != prepared) return;
                try {
                    prepared.start();
                    started.set(true);
                    JSObject result = new JSObject();
                    result.put("started", true);
                    call.resolve(result);
                } catch (IllegalStateException error) {
                    notifyPlaybackError(playbackToken, "Android MediaPlayer nije pokrenuo snimak.");
                    stopAndReleasePlayer();
                }
            });
            player.setOnCompletionListener(completed -> {
                if (mediaPlayer != completed) return;
                String completedToken = playbackToken;
                stopAndReleasePlayer();
                JSObject event = new JSObject();
                event.put("token", completedToken);
                notifyListeners("playbackEnded", event);
            });
            player.setOnErrorListener((failed, what, extra) -> {
                if (mediaPlayer != failed) return true;
                String failedToken = playbackToken;
                if (started.get()) {
                    notifyPlaybackError(
                        failedToken,
                        "Android MediaPlayer greška " + what + "/" + extra
                    );
                } else {
                    JSObject result = new JSObject();
                    result.put("started", false);
                    call.resolve(result);
                }
                stopAndReleasePlayer();
                return true;
            });
            try {
                if (isBundledAudio(uri)) {
                    String assetPath = bundledAssetPath(uri);
                    activeAssetDescriptor = getContext().getAssets().openFd(assetPath);
                    player.setDataSource(
                        activeAssetDescriptor.getFileDescriptor(),
                        activeAssetDescriptor.getStartOffset(),
                        activeAssetDescriptor.getLength()
                    );
                } else {
                    String scheme = uri.getScheme();
                    if (!"https".equalsIgnoreCase(scheme) && !"http".equalsIgnoreCase(scheme)) {
                        throw new IllegalArgumentException("Audio izvor nije dozvoljen.");
                    }
                    player.setDataSource(url);
                }
                player.prepareAsync();
            } catch (Exception error) {
                stopAndReleasePlayer();
                call.reject("Android nije otvorio audio snimak.", error);
            }
        });
    }

    @PluginMethod
    public void pausePlayback(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                if (mediaPlayer != null && mediaPlayer.isPlaying()) mediaPlayer.pause();
            } catch (IllegalStateException ignored) {
                // Već je oslobođen.
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void resumePlayback(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                if (mediaPlayer != null && !mediaPlayer.isPlaying()) mediaPlayer.start();
            } catch (IllegalStateException ignored) {
                // Već je oslobođen.
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void stopPlayback(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            stopAndReleasePlayer();
            call.resolve();
        });
    }

    @Override
    protected void handleOnDestroy() {
        stopAndReleasePlayer();
        super.handleOnDestroy();
    }

    private void stopAndReleasePlayer() {
        MediaPlayer player = mediaPlayer;
        mediaPlayer = null;
        playbackToken = null;
        resumeAfterFocusGain = false;
        if (player != null) {
            try {
                player.stop();
            } catch (IllegalStateException ignored) {
                // Player možda još nije završio prepareAsync.
            }
            player.reset();
            player.release();
        }
        closeAssetDescriptor();
        releasePlaybackAudioFocus();
    }

    private void closeAssetDescriptor() {
        AssetFileDescriptor descriptor = activeAssetDescriptor;
        activeAssetDescriptor = null;
        if (descriptor == null) return;
        try {
            descriptor.close();
        } catch (IOException ignored) {
            // Nema bezbedne akcije; plejer je već oslobođen.
        }
    }

    private boolean requestPlaybackAudioFocus() {
        if (audioManager == null) {
            audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
        }
        if (audioManager == null) return false;

        int result;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AudioAttributes attributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build();
            audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                .setAudioAttributes(attributes)
                .setAcceptsDelayedFocusGain(false)
                .setWillPauseWhenDucked(true)
                .setOnAudioFocusChangeListener(audioFocusListener)
                .build();
            result = audioManager.requestAudioFocus(audioFocusRequest);
        } else {
            result = audioManager.requestAudioFocus(
                audioFocusListener,
                AudioManager.STREAM_MUSIC,
                AudioManager.AUDIOFOCUS_GAIN_TRANSIENT
            );
        }
        return result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
    }

    private void releasePlaybackAudioFocus() {
        if (audioManager == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
            audioManager.abandonAudioFocusRequest(audioFocusRequest);
            audioFocusRequest = null;
        } else {
            audioManager.abandonAudioFocus(audioFocusListener);
        }
    }

    private void notifyPlaybackError(String token, String message) {
        JSObject event = new JSObject();
        event.put("token", token);
        event.put("message", message);
        notifyListeners("playbackError", event);
    }

    private void prepareAudioEnvironment() {
        AccessibilityManager accessibilityManager = (AccessibilityManager)
            getContext().getSystemService(Context.ACCESSIBILITY_SERVICE);
        if (accessibilityManager != null && accessibilityManager.isEnabled()) {
            // TalkBack i drugi accessibility servisi mogu nastaviti prethodnu
            // najavu preko lokalnog snimka. Prekid sprečava mešanje dva glasa.
            accessibilityManager.interrupt();
        }
        getActivity().setVolumeControlStream(AudioManager.STREAM_MUSIC);
        getBridge().getWebView().setImportantForAccessibility(
            View.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS
        );
    }

    private boolean isBundledAudio(Uri uri) {
        String scheme = uri.getScheme();
        String host = uri.getHost();
        return scheme == null
            || (("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme))
                && "localhost".equalsIgnoreCase(host));
    }

    private String bundledAssetPath(Uri uri) {
        String path = uri.getPath();
        if (path == null) throw new IllegalArgumentException("Nedostaje audio putanja.");
        while (path.startsWith("/")) path = path.substring(1);
        if (!path.startsWith("audio/") || path.contains("..") || path.contains("\\")) {
            throw new IllegalArgumentException("Lokalna audio putanja nije dozvoljena.");
        }
        return "public/" + path;
    }
}
