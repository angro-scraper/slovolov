import '../data/local_learning_repository.dart';
import '../domain/learning_progress.dart';
import '../domain/letter_lesson.dart';
import '../../rewards/domain/reward.dart';
import 'lesson_session.dart';

class LearningFlowResult {
  const LearningFlowResult({
    required this.progress,
    required this.message,
    this.reward,
  });

  final LearningProgress progress;
  final String message;
  final Reward? reward;
}

class LearningFlow {
  LearningFlow(this._repository);

  final LocalLearningRepository _repository;

  LessonSession beginLesson(
    LetterLesson lesson, {
    required bool fullContentUnlocked,
  }) {
    if (!lesson.isFree && !fullContentUnlocked) {
      throw StateError(
        'Lekcija je zaključana. Potrebno je odobreno otključavanje.',
      );
    }
    final session = LessonSession(lessonId: lesson.id)..start();
    return session;
  }

  Future<LearningFlowResult> completeTracing({
    required String childId,
    required LetterLesson lesson,
    required LessonSession session,
    required double accuracy,
  }) async {
    if (session.lessonId != lesson.id) {
      throw StateError('Aktivna lekcija se ne poklapa sa pokušajem.');
    }
    final passed = session.submitTracing(accuracy);
    if (!passed) {
      return LearningFlowResult(
        progress: await _repository.load(childId),
        message: 'Pokušaj ponovo i polako prati svetleću putanju.',
      );
    }
    final progress = await _repository.markCompleted(
      childId,
      lesson.id,
      stars: 3,
    );
    return LearningFlowResult(
      progress: progress,
      message: 'Bravo! Naučio si slovo ${lesson.cyrillicUpper}!',
      reward: Reward(
        id: 'letter-${lesson.id}',
        title: '${lesson.word} nalepnica',
        kind: RewardKind.sticker,
        emoji: lesson.emoji,
      ),
    );
  }
}
