package rs.slovolov.app;

import android.media.AudioManager;

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
        getActivity().setVolumeControlStream(AudioManager.STREAM_MUSIC);
        JSObject result = new JSObject();
        result.put("granted", true);
        call.resolve(result);
    }

    @PluginMethod
    public void release(PluginCall call) {
        call.resolve();
    }
}
