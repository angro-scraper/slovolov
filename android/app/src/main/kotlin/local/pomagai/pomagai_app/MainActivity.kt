package local.pomagai.pomagai_app

import android.speech.tts.TextToSpeech
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.util.Locale

class MainActivity : FlutterActivity(), TextToSpeech.OnInitListener {
    private val channelName = "pomagai.local_storage"
    private val speechChannelName = "slovoigra/speech"
    private val preferencesName = "pomagai_offline_data"
    private var textToSpeech: TextToSpeech? = null
    private var speechReady = false
    private var pendingSpeech: Pair<String, MethodChannel.Result>? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        textToSpeech = TextToSpeech(this, this)
        val preferences = getSharedPreferences(preferencesName, MODE_PRIVATE)
        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            channelName,
        ).setMethodCallHandler { call, result ->
            val key = call.argument<String>("key")
            if (key.isNullOrBlank()) {
                result.error("invalid_key", "Storage key is required.", null)
                return@setMethodCallHandler
            }
            when (call.method) {
                "read" -> result.success(preferences.getString(key, null))
                "write" -> {
                    val value = call.argument<String>("value")
                    if (value == null) {
                        result.error(
                            "invalid_value",
                            "Storage value is required.",
                            null,
                        )
                    } else {
                        preferences.edit().putString(key, value).apply()
                        result.success(null)
                    }
                }
                else -> result.notImplemented()
            }
        }
        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            speechChannelName,
        ).setMethodCallHandler { call, result ->
            when (call.method) {
                "speak" -> {
                    val text = call.argument<String>("text")?.trim()
                    if (text.isNullOrEmpty()) {
                        result.error("invalid_text", "Tekst za izgovor je prazan.", null)
                    } else if (speechReady) {
                        speak(text, result)
                    } else {
                        pendingSpeech?.second?.error(
                            "speech_replaced",
                            "Prethodni zahtev za izgovor je zamenjen.",
                            null,
                        )
                        pendingSpeech = text to result
                    }
                }
                "stop" -> {
                    pendingSpeech = null
                    textToSpeech?.stop()
                    result.success(null)
                }
                else -> result.notImplemented()
            }
        }
    }

    override fun onInit(status: Int) {
        if (status != TextToSpeech.SUCCESS) {
            pendingSpeech?.second?.error(
                "speech_unavailable",
                "Govorni servis na uređaju nije dostupan.",
                null,
            )
            pendingSpeech = null
            return
        }
        val languageResult = textToSpeech?.setLanguage(Locale("sr", "RS"))
        speechReady = languageResult != TextToSpeech.LANG_MISSING_DATA &&
            languageResult != TextToSpeech.LANG_NOT_SUPPORTED
        val pending = pendingSpeech
        pendingSpeech = null
        if (!speechReady) {
            pending?.second?.error(
                "serbian_voice_unavailable",
                "Srpski glas nije instaliran. Dodajte srpski jezik u podešavanjima govora.",
                null,
            )
        } else if (pending != null) {
            speak(pending.first, pending.second)
        }
    }

    private fun speak(text: String, result: MethodChannel.Result) {
        val code = textToSpeech?.speak(
            text,
            TextToSpeech.QUEUE_FLUSH,
            null,
            "slovoigra-${System.currentTimeMillis()}",
        )
        if (code == TextToSpeech.SUCCESS) {
            result.success(
                mapOf(
                    "spoken" to true,
                    "locale" to "sr-RS",
                    "message" to "Izgovor je pokrenut.",
                ),
            )
        } else {
            result.error("speech_failed", "Izgovor nije mogao da se pokrene.", null)
        }
    }

    override fun onDestroy() {
        pendingSpeech = null
        textToSpeech?.stop()
        textToSpeech?.shutdown()
        textToSpeech = null
        super.onDestroy()
    }
}
