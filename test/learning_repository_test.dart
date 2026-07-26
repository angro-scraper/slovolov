import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pomagai_app/features/learning/data/local_learning_repository.dart';
import 'package:pomagai_app/features/learning/data/serbian_letter_catalog.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('katalog ima svih 30 slova i prvih pet je besplatno', () {
    expect(SerbianLetterCatalog.lessons, hasLength(30));
    expect(
      SerbianLetterCatalog.lessons.where((lesson) => lesson.isFree),
      hasLength(5),
    );
    expect(SerbianLetterCatalog.lessons.first.cyrillicUpper, 'А');
    expect(SerbianLetterCatalog.lessons.last.latinUpper, 'Š');
  });

  test('lokalni napredak opstaje i ne duplira zvezdice', () async {
    final repository = LocalLearningRepository(JsonProgressStore());

    await repository.markCompleted('dete-1', 'a', stars: 2);
    await repository.markCompleted('dete-1', 'a', stars: 2);
    await repository.addLearningTime('dete-1', const Duration(minutes: 3));
    final progress = await repository.load('dete-1');

    expect(progress.completedLessonIds, {'a'});
    expect(progress.stars, 2);
    expect(progress.learningSeconds, 180);
    expect(progress.completionFor(30), closeTo(1 / 30, 0.0001));
  });

  test('napredak opstaje kroz novi device store', () async {
    const channel = MethodChannel('pomagai.local_storage');
    final records = <String, String>{};
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, (call) async {
          final arguments = (call.arguments! as Map<Object?, Object?>)
              .cast<String, Object?>();
          final key = arguments['key']! as String;
          if (call.method == 'read') return records[key];
          if (call.method == 'write') {
            records[key] = arguments['value']! as String;
            return null;
          }
          throw MissingPluginException(call.method);
        });
    addTearDown(
      () => TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
          .setMockMethodCallHandler(channel, null),
    );

    final first = LocalLearningRepository(
      DeviceProgressStore(channel: channel),
    );
    await first.markCompleted('dete-device', 'a', stars: 3);

    final afterRestart = LocalLearningRepository(
      DeviceProgressStore(channel: channel),
    );
    final restored = await afterRestart.load('dete-device');
    expect(restored.completedLessonIds, {'a'});
    expect(restored.stars, 3);
  });
}
