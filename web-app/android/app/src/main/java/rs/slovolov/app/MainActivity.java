package rs.slovolov.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

/**
 * Aktivnost ne sme da zadržava audio fokus dok se ništa ne reprodukuje.
 * Fokus se dobija i oslobađa unutar SlovolovAudioSessionPlugin-a, tačno za
 * trajanje pojedinačnog snimka. To sprečava problem sa zvukom na pojedinim
 * Android tabletima i telefonima.
 */
public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(SlovolovAudioSessionPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
