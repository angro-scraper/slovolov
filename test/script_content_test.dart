import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:pomagai_app/features/learning/data/serbian_letter_catalog.dart';
import 'package:pomagai_app/features/learning/domain/letter_lesson.dart';

void main() {
  group('sadržaj po pismu', () {
    test('ćirilica prikazuje ćiriličnu reč, latinica latiničnu istu reč', () {
      final lesson = SerbianLetterCatalog.byId('m');

      expect(lesson.wordFor(ScriptMode.cyrillic), 'Меда');
      expect(lesson.wordFor(ScriptMode.latin), 'Meda');
      expect(lesson.spokenPromptFor(ScriptMode.cyrillic), 'М као меда');
      expect(lesson.spokenPromptFor(ScriptMode.latin), 'M kao meda');
    });

    test('primer za Е koristi sliku istog pojma, ne šraf umesto eksera', () {
      final lesson = SerbianLetterCatalog.byId('e');

      expect(lesson.wordFor(ScriptMode.cyrillic), 'Елф');
      expect(lesson.wordFor(ScriptMode.latin), 'Elf');
      expect(lesson.emoji, '🧝');
    });

    test('katalog nema poznate pogrešne parove reči i ilustracije', () {
      final lj = SerbianLetterCatalog.byId('lj');
      final dzh = SerbianLetterCatalog.byId('dzh');

      expect(lj.wordFor(ScriptMode.cyrillic), 'Љубичица');
      expect(lj.emoji, '🪻');
      expect(dzh.wordFor(ScriptMode.cyrillic), 'Џип');
      expect(dzh.emoji, '🚙');
    });
  });

  test('interaktivne lekcije imaju kompaktne panele umesto vertikalnog ListView-a', () {
    final source = File('lib/main.dart').readAsStringSync();
    final lessonStart = source.indexOf('class _LessonPageState');
    final lessonEnd = source.indexOf('class _LetterTraceCanvas');
    final coloringStart = source.indexOf('class _ColoringPageState');
    final coloringEnd = source.indexOf('class _ColoringPoint');

    expect(source.substring(lessonStart, lessonEnd), contains('SegmentedButton<int>'));
    expect(source.substring(lessonStart, lessonEnd), isNot(contains('child: ListView(')));
    expect(source.substring(coloringStart, coloringEnd), isNot(contains('child: ListView(')));
  });
}
