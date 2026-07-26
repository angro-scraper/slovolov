enum LessonSessionState { ready, tracing, retry, completed }

class LessonSession {
  LessonSession({required this.lessonId});

  final String lessonId;
  LessonSessionState state = LessonSessionState.ready;
  double? lastAccuracy;

  void start() {
    if (state != LessonSessionState.ready) {
      throw StateError('Nedozvoljena tranzicija: lekcija je već pokrenuta.');
    }
    state = LessonSessionState.tracing;
  }

  bool submitTracing(double accuracy) {
    if (state != LessonSessionState.tracing &&
        state != LessonSessionState.retry) {
      throw StateError('Nedozvoljena tranzicija: iscrtavanje nije aktivno.');
    }
    if (accuracy < 0 || accuracy > 1) {
      throw ArgumentError.value(accuracy, 'accuracy', 'Mora biti 0–1.');
    }
    lastAccuracy = accuracy;
    final passed = accuracy >= 0.75;
    state = passed ? LessonSessionState.completed : LessonSessionState.retry;
    return passed;
  }
}
