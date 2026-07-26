class ChildProfile {
  const ChildProfile({
    required this.id,
    required this.displayName,
    required this.createdAt,
  });

  final String id;
  final String displayName;
  final DateTime createdAt;

  Map<String, Object?> toJson() => {
    'id': id,
    'displayName': displayName,
    'createdAt': createdAt.toIso8601String(),
  };

  factory ChildProfile.fromJson(Map<String, Object?> json) => ChildProfile(
    id: json['id']! as String,
    displayName: json['displayName']! as String,
    createdAt: DateTime.parse(json['createdAt']! as String),
  );
}

class LearningProgress {
  const LearningProgress({
    required this.childId,
    this.completedLessonIds = const <String>{},
    this.stars = 0,
    this.learningSeconds = 0,
  });

  final String childId;
  final Set<String> completedLessonIds;
  final int stars;
  final int learningSeconds;

  double completionFor(int lessonCount) =>
      lessonCount == 0 ? 0 : completedLessonIds.length / lessonCount;

  LearningProgress complete(String lessonId, {int earnedStars = 1}) {
    if (completedLessonIds.contains(lessonId)) return this;
    return LearningProgress(
      childId: childId,
      completedLessonIds: {...completedLessonIds, lessonId},
      stars: stars + earnedStars,
      learningSeconds: learningSeconds,
    );
  }

  LearningProgress addLearningTime(Duration duration) => LearningProgress(
    childId: childId,
    completedLessonIds: completedLessonIds,
    stars: stars,
    learningSeconds: learningSeconds + duration.inSeconds,
  );

  Map<String, Object?> toJson() => {
    'childId': childId,
    'completedLessonIds': completedLessonIds.toList()..sort(),
    'stars': stars,
    'learningSeconds': learningSeconds,
  };

  factory LearningProgress.fromJson(Map<String, Object?> json) =>
      LearningProgress(
        childId: json['childId']! as String,
        completedLessonIds: (json['completedLessonIds']! as List<Object?>)
            .cast<String>()
            .toSet(),
        stars: json['stars']! as int,
        learningSeconds: json['learningSeconds']! as int,
      );
}
