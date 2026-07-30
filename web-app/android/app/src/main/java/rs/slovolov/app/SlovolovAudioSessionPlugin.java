package rs.slovolov.app;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.net.Uri;
import android.view.View;
import android.view.accessibility.AccessibilityManager;

import java.util.concurrent.atomic.AtomicBoolean;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * WebView već preuzima Android audio fokus kada HTML snimak počne. Plugin zato
 * ne otvara drugi fokus-klijent koji bi pauzirao isti snimak, već potvrđuje da
 * fizička dugmad uređaja kontrolišu odgovarajući media kanal.
 */
@CapacitorPlugin(name = "SlovolovAudioSession")
public class SlovolovAudioSessionPlugin extends Plugin {
    private MediaPlayer mediaPlayer;
    private String playbackToken;

    @PluginMethod
    public void activate(PluginCall call) {
        AccessibilityManager accessibilityManager = (AccessibilityManager)
            getContext().getSystemService(Context.ACCESSIBILITY_SERVICE);
        if (accessibilityManager != null && accessibilityManager.isEnabled()) {
            // TalkBack i drugi accessibility servisi mogu nastaviti prethodnu
            // najavu preko lokalnog kviz snimka. Androidov javni API traži da
            // svi takvi servisi odmah prekinu trenutni govorni feedback.
            accessibilityManager.interrupt();
        }
        getActivity().setVolumeControlStream(AudioManager.STREAM_MUSIC);
        getActivity().runOnUiThread(() -> {
            getBridge().getWebView().setImportantForAccessibility(
                View.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS
            );
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
        String scheme = uri.getScheme();
        if (!"https".equalsIgnoreCase(scheme) && !"http".equalsIgnoreCase(scheme)) {
            call.reject("Audio URL mora koristiti HTTP ili HTTPS.");
            return;
        }

        getActivity().runOnUiThread(() -> {
            stopAndReleasePlayer();
            playbackToken = token;
            MediaPlayer player = new MediaPlayer();
            AtomicBoolean started = new AtomicBoolean(false);
            mediaPlayer = player;
            player.setAudioAttributes(
                new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build()
            );
            player.setOnPreparedListener(prepared -> {
                if (mediaPlayer != prepared) return;
                prepared.start();
                started.set(true);
                JSObject result = new JSObject();
                result.put("started", true);
                call.resolve(result);
            });
            player.setOnCompletionListener(completed -> {
                if (mediaPlayer != completed) return;
                JSObject event = new JSObject();
                event.put("token", playbackToken);
                notifyListeners("playbackEnded", event);
                stopAndReleasePlayer();
            });
            player.setOnErrorListener((failed, what, extra) -> {
                if (mediaPlayer != failed) return true;
                if (started.get()) {
                    JSObject event = new JSObject();
                    event.put("token", playbackToken);
                    event.put("message", "Android MediaPlayer greška " + what + "/" + extra);
                    notifyListeners("playbackError", event);
                } else {
                    JSObject result = new JSObject();
                    result.put("started", false);
                    call.resolve(result);
                }
                stopAndReleasePlayer();
                return true;
            });
            try {
                player.setDataSource(url);
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
            if (mediaPlayer != null && mediaPlayer.isPlaying()) mediaPlayer.pause();
            call.resolve();
        });
    }

    @PluginMethod
    public void resumePlayback(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (mediaPlayer != null && !mediaPlayer.isPlaying()) mediaPlayer.start();
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
        if (player == null) return;
        try {
            player.stop();
        } catch (IllegalStateException ignored) {
            // Player možda još nije završio prepareAsync.
        }
        player.reset();
        player.release();
    }
}
