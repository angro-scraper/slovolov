import 'package:flutter_test/flutter_test.dart';
import 'package:pomagai_app/features/learning/data/serbian_letter_catalog.dart';
import 'package:pomagai_app/features/learning/domain/letter_animation.dart';

void main() {
  test('svih 30 slova ima proverljivu animaciju ilustracije', () {
    for (final lesson in SerbianLetterCatalog.lessons) {
      final animation = LetterAnimation.forLetter(lesson.id);
      expect(animation.label, isNotEmpty, reason: lesson.id);
      expect(
        animation.label,
        isNot('Ilustracija oživljava'),
        reason: '${lesson.id} mora imati svoju animaciju.',
      );
    }
    expect(LetterAnimation.forLetter('a').kind, LetterAnimationKind.fly);
    expect(LetterAnimation.forLetter('b').kind, LetterAnimationKind.rise);
  });
}
