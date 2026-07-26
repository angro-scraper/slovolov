import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pomagai_app/features/learning/data/serbian_letter_catalog.dart';
import 'package:pomagai_app/features/tracing/domain/letter_trace_guide.dart';

void main() {
  test('svako srpsko slovo ima svoju putanju za pisanje', () {
    for (final lesson in SerbianLetterCatalog.lessons) {
      final guide = LetterTraceGuide.forLetter(lesson.id);
      expect(guide.strokes, isNotEmpty, reason: lesson.id);
      expect(
        guide.strokes.every((stroke) => stroke.length >= 2),
        isTrue,
        reason: lesson.id,
      );
    }
    expect(
      LetterTraceGuide.forLetter('a').strokes,
      isNot(LetterTraceGuide.forLetter('b').strokes),
    );
  });

  test('tačno praćenje vodiča daje visok rezultat', () {
    const size = Size(320, 320);
    final guide = LetterTraceGuide.forLetter('m');
    final drawn = guide.scale(size);

    expect(guide.accuracy(drawn, size), greaterThan(.95));
    expect(guide.accuracy(const <List<Offset>>[], size), 0);
  });
}
