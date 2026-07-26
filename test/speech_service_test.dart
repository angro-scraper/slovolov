import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pomagai_app/features/audio/application/speech_service.dart';
import 'package:pomagai_app/features/learning/data/serbian_letter_catalog.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test(
    'izgovor šalje srpski tekst i locale stvarnom platformskom kanalu',
    () async {
      final calls = <MethodCall>[];
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
          .setMockMethodCallHandler(SpeechService.channel, (call) async {
            calls.add(call);
            return <String, Object?>{'spoken': true, 'locale': 'sr-RS'};
          });
      addTearDown(
        () => TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
            .setMockMethodCallHandler(SpeechService.channel, null),
      );

      final result = await const SpeechService().speakLesson(
        SerbianLetterCatalog.byId('a'),
      );

      expect(result.spoken, isTrue);
      expect(calls.single.method, 'speak');
      expect(calls.single.arguments, <String, Object?>{
        'text': 'А. А kao avion.',
        'locale': 'sr-RS',
      });
    },
  );
}
