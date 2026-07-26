import 'dart:math';

import '../../learning/data/serbian_letter_catalog.dart';
import '../../learning/domain/letter_lesson.dart';

enum LetterGameKind { matchPicture, findSpoken, balloons }

class LetterGameRound {
  const LetterGameRound({required this.target, required this.options});

  final LetterLesson target;
  final List<LetterLesson> options;
}

class LetterGameAnswer {
  const LetterGameAnswer({required this.correct, required this.message});

  final bool correct;
  final String message;
}

class LetterGameEngine {
  LetterGameEngine({required this.kind, int? seed})
    : _random = Random(seed ?? DateTime.now().millisecondsSinceEpoch);

  final LetterGameKind kind;
  final Random _random;
  int score = 0;

  LetterGameRound newRound() {
    final lessons = SerbianLetterCatalog.lessons;
    final target = lessons[_random.nextInt(lessons.length)];
    final options = <LetterLesson>[target];
    while (options.length < 4) {
      final candidate = lessons[_random.nextInt(lessons.length)];
      if (!options.any((item) => item.id == candidate.id)) {
        options.add(candidate);
      }
    }
    options.shuffle(_random);
    return LetterGameRound(target: target, options: options);
  }

  LetterGameAnswer answer(LetterGameRound round, LetterLesson selected) {
    if (selected.id == round.target.id) {
      score += 1;
      return LetterGameAnswer(
        correct: true,
        message: 'Bravo! Osvojio/la si zvezdicu.',
      );
    }
    return LetterGameAnswer(
      correct: false,
      message: 'Pokušaj ponovo. Potraži slovo ${round.target.cyrillicUpper}.',
    );
  }
}
