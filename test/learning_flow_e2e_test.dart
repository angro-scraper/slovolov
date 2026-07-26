import 'package:flutter_test/flutter_test.dart';
import 'package:pomagai_app/features/learning/application/learning_flow.dart';
import 'package:pomagai_app/features/learning/application/lesson_session.dart';
import 'package:pomagai_app/features/learning/data/local_learning_repository.dart';
import 'package:pomagai_app/features/learning/data/serbian_letter_catalog.dart';

void main() {
  test('glavni tok čuva napredak i dodeljuje nagradu', () async {
    final repository = LocalLearningRepository(JsonProgressStore());
    final flow = LearningFlow(repository);
    final lesson = SerbianLetterCatalog.lessons.first;
    final session = flow.beginLesson(lesson, fullContentUnlocked: false);

    final retry = await flow.completeTracing(
      childId: 'dete-1',
      lesson: lesson,
      session: session,
      accuracy: 0.42,
    );
    expect(session.state, LessonSessionState.retry);
    expect(retry.reward, isNull);
    expect(retry.progress.stars, 0);

    final success = await flow.completeTracing(
      childId: 'dete-1',
      lesson: lesson,
      session: session,
      accuracy: 0.91,
    );
    final persisted = await repository.load('dete-1');
    expect(session.state, LessonSessionState.completed);
    expect(success.reward?.title, 'Avion nalepnica');
    expect(persisted.completedLessonIds, {'a'});
    expect(persisted.stars, 3);
  });

  test('nedozvoljena tranzicija i zaključana lekcija daju jasnu grešku', () {
    final flow = LearningFlow(LocalLearningRepository(JsonProgressStore()));
    final locked = SerbianLetterCatalog.lessons[5];
    expect(
      () => flow.beginLesson(locked, fullContentUnlocked: false),
      throwsA(isA<StateError>()),
    );
    final session = LessonSession(lessonId: 'a');
    expect(() => session.submitTracing(0.9), throwsA(isA<StateError>()));
  });
}
