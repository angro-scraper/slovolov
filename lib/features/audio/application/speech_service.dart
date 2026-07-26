import 'package:flutter/services.dart';

import '../../learning/domain/letter_lesson.dart';

class SpeechResult {
  const SpeechResult({
    required this.spoken,
    required this.locale,
    this.message = '',
  });

  final bool spoken;
  final String locale;
  final String message;
}

class SpeechService {
  const SpeechService();

  static const channel = MethodChannel('slovoigra/speech');

  Future<SpeechResult> speakLesson(LetterLesson lesson) =>
      speak('${lesson.cyrillicUpper}. ${lesson.spokenPrompt}.');

  Future<SpeechResult> speak(String text) async {
    try {
      final raw = await channel.invokeMapMethod<String, Object?>(
        'speak',
        <String, Object?>{'text': text, 'locale': 'sr-RS'},
      );
      return SpeechResult(
        spoken: raw?['spoken'] == true,
        locale: (raw?['locale'] as String?) ?? 'sr-RS',
        message: (raw?['message'] as String?) ?? '',
      );
    } on PlatformException catch (error) {
      return SpeechResult(
        spoken: false,
        locale: 'sr-RS',
        message: error.message ?? 'Izgovor trenutno nije dostupan.',
      );
    } on MissingPluginException {
      return const SpeechResult(
        spoken: false,
        locale: 'sr-RS',
        message: 'Izgovor nije podržan na ovom uređaju.',
      );
    }
  }

  Future<void> stop() async {
    try {
      await channel.invokeMethod<void>('stop');
    } on PlatformException {
      // Gašenje govora je bezbedan best-effort pri napuštanju ekrana.
    } on MissingPluginException {
      // Test/web okruženje nema platformski TTS.
    }
  }
}
