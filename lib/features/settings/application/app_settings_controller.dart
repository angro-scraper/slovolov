import 'dart:convert';

import 'package:flutter/material.dart';

import '../../learning/data/local_learning_repository.dart';

class AppSettings {
  const AppSettings({
    this.themeMode = ThemeMode.light,
    this.soundEnabled = true,
    this.latinPreferred = false,
    this.fullContentUnlocked = true,
  });

  final ThemeMode themeMode;
  final bool soundEnabled;
  final bool latinPreferred;
  final bool fullContentUnlocked;

  AppSettings copyWith({
    ThemeMode? themeMode,
    bool? soundEnabled,
    bool? latinPreferred,
  }) => AppSettings(
    themeMode: themeMode ?? this.themeMode,
    soundEnabled: soundEnabled ?? this.soundEnabled,
    latinPreferred: latinPreferred ?? this.latinPreferred,
    fullContentUnlocked: true,
  );

  Map<String, Object?> toJson() => {
    'themeMode': themeMode.name,
    'soundEnabled': soundEnabled,
    'latinPreferred': latinPreferred,
    'fullContentUnlocked': true,
  };

  factory AppSettings.fromJson(Map<String, Object?> json) => AppSettings(
    themeMode: ThemeMode.values.firstWhere(
      (value) => value.name == json['themeMode'],
      orElse: () => ThemeMode.light,
    ),
    soundEnabled: json['soundEnabled'] as bool? ?? true,
    latinPreferred: json['latinPreferred'] as bool? ?? false,
  );
}

class AppSettingsController extends ChangeNotifier {
  static const storageKey = 'slovoigra-settings';
  AppSettings settings = const AppSettings();
  ProgressStore? _store;

  Future<void> configure(ProgressStore store) async {
    _store = store;
    final raw = await store.read(storageKey);
    if (raw != null) {
      settings = AppSettings.fromJson(
        (jsonDecode(raw) as Map<Object?, Object?>).cast<String, Object?>(),
      );
    }
    notifyListeners();
  }

  Future<void> setThemeMode(ThemeMode value) async {
    settings = settings.copyWith(themeMode: value);
    await _save();
  }

  Future<void> setSoundEnabled(bool value) async {
    settings = settings.copyWith(soundEnabled: value);
    await _save();
  }

  Future<void> setLatinPreferred(bool value) async {
    settings = settings.copyWith(latinPreferred: value);
    await _save();
  }

  Future<void> _save() async {
    await _store?.write(storageKey, jsonEncode(settings.toJson()));
    notifyListeners();
  }
}
