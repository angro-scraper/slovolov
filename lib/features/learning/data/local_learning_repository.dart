import 'dart:convert';

import 'package:flutter/services.dart';

import '../domain/learning_progress.dart';

abstract interface class ProgressStore {
  Future<String?> read(String childId);
  Future<void> write(String childId, String json);
}

class JsonProgressStore implements ProgressStore {
  final Map<String, String> _records = <String, String>{};

  @override
  Future<String?> read(String childId) async => _records[childId];

  @override
  Future<void> write(String childId, String json) async {
    _records[childId] = json;
  }
}

class DeviceProgressStore implements ProgressStore {
  DeviceProgressStore({MethodChannel? channel, this.testFallback})
    : _channel = channel ?? const MethodChannel('pomagai.local_storage');

  final MethodChannel _channel;
  final ProgressStore? testFallback;

  @override
  Future<String?> read(String childId) async {
    try {
      return await _channel.invokeMethod<String>('read', <String, Object?>{
        'key': childId,
      });
    } on MissingPluginException {
      final fallback = testFallback;
      if (fallback == null) rethrow;
      return fallback.read(childId);
    }
  }

  @override
  Future<void> write(String childId, String json) async {
    try {
      await _channel.invokeMethod<void>('write', <String, Object?>{
        'key': childId,
        'value': json,
      });
    } on MissingPluginException {
      final fallback = testFallback;
      if (fallback == null) rethrow;
      await fallback.write(childId, json);
    }
  }
}

class LocalLearningRepository {
  LocalLearningRepository(this._store);

  final ProgressStore _store;

  Future<LearningProgress> load(String childId) async {
    final raw = await _store.read(childId);
    if (raw == null) return LearningProgress(childId: childId);
    return LearningProgress.fromJson(
      (jsonDecode(raw) as Map<Object?, Object?>).cast<String, Object?>(),
    );
  }

  Future<LearningProgress> markCompleted(
    String childId,
    String lessonId, {
    int stars = 1,
  }) async {
    final updated = (await load(
      childId,
    )).complete(lessonId, earnedStars: stars);
    await _store.write(childId, jsonEncode(updated.toJson()));
    return updated;
  }

  Future<LearningProgress> addLearningTime(
    String childId,
    Duration duration,
  ) async {
    final updated = (await load(childId)).addLearningTime(duration);
    await _store.write(childId, jsonEncode(updated.toJson()));
    return updated;
  }

  Future<LearningProgress> reset(String childId) async {
    final empty = LearningProgress(childId: childId);
    await _store.write(childId, jsonEncode(empty.toJson()));
    return empty;
  }
}
