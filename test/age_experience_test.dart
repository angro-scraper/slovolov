import 'package:flutter_test/flutter_test.dart';
import 'package:pomagai_app/features/learning/data/serbian_letter_catalog.dart';
import 'package:pomagai_app/features/learning/domain/learning_level.dart';

void main() {
  test('sadržaj raste od slova do reči i razumevanja', () {
    expect(LearningLevel.values, hasLength(3));
    expect(LearningLevel.preschool.label, '3–5 godina');
    expect(LearningLevel.earlySchool.label, '6–8 godina');
    expect(LearningLevel.wordExplorer.label, '8–10 godina');

    final lesson = SerbianLetterCatalog.byId('m');
    expect(lesson.syllables, isNotEmpty);
    expect(lesson.sentence, contains(lesson.word));
    expect(lesson.challengeQuestion, isNotEmpty);
  });
}
