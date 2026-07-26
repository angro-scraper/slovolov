import '../../learning/data/local_learning_repository.dart';
import '../../learning/domain/letter_lesson.dart';
import '../domain/audit_entry.dart';

class ParentOverview {
  const ParentOverview({
    required this.learnedLetters,
    required this.totalLetters,
    required this.stars,
    required this.learningSeconds,
    required this.dailyGoalMinutes,
    required this.completedLessonIds,
  });

  final int learnedLetters;
  final int totalLetters;
  final int stars;
  final int learningSeconds;
  final int dailyGoalMinutes;
  final Set<String> completedLessonIds;
}

class ParentDashboardService {
  ParentDashboardService(this._repository);

  final LocalLearningRepository _repository;
  final List<AuditEntry> _audit = <AuditEntry>[];
  final Map<String, int> _dailyGoals = <String, int>{};

  void _requireAdult(LocalRole role) {
    if (role != LocalRole.parent && role != LocalRole.contentAdmin) {
      throw const PermissionDenied('Pristup nije dozvoljen za dečji profil.');
    }
  }

  Future<ParentOverview> overview({
    required LocalRole role,
    required String childId,
    required int totalLetters,
  }) async {
    _requireAdult(role);
    final progress = await _repository.load(childId);
    return ParentOverview(
      learnedLetters: progress.completedLessonIds.length,
      totalLetters: totalLetters,
      stars: progress.stars,
      learningSeconds: progress.learningSeconds,
      dailyGoalMinutes: _dailyGoals[childId] ?? 15,
      completedLessonIds: progress.completedLessonIds,
    );
  }

  Future<List<LetterLesson>> searchLessons({
    required LocalRole role,
    required String childId,
    required List<LetterLesson> lessons,
    String query = '',
    bool onlyCompleted = false,
  }) async {
    _requireAdult(role);
    final progress = await _repository.load(childId);
    final normalized = query.trim().toLowerCase();
    return lessons
        .where((lesson) {
          final matchesQuery =
              normalized.isEmpty ||
              lesson.word.toLowerCase().contains(normalized) ||
              lesson.cyrillicUpper.toLowerCase().contains(normalized) ||
              lesson.latinUpper.toLowerCase().contains(normalized);
          final matchesProgress =
              !onlyCompleted || progress.completedLessonIds.contains(lesson.id);
          return matchesQuery && matchesProgress;
        })
        .toList(growable: false);
  }

  void updateDailyGoal({
    required LocalRole role,
    required String actorId,
    required String childId,
    required int minutes,
  }) {
    _requireAdult(role);
    if (minutes < 5 || minutes > 120) {
      throw ArgumentError.value(minutes, 'minutes', 'Dozvoljeno je 5–120.');
    }
    _dailyGoals[childId] = minutes;
    _audit.add(
      AuditEntry(
        actorId: actorId,
        action: 'daily_goal_updated',
        detail: 'child=$childId; minutes=$minutes',
        createdAt: DateTime.now().toUtc(),
      ),
    );
  }

  List<AuditEntry> auditHistory(LocalRole role) {
    _requireAdult(role);
    return List<AuditEntry>.unmodifiable(_audit.reversed);
  }
}
