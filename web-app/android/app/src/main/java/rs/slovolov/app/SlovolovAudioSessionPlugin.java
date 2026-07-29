package rs.slovolov.app;

import android.content.Context;
import android.media.AudioManager;
import android.view.View;
import android.view.accessibility.AccessibilityManager;

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
}
