import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pomagai_app/features/learning/data/local_learning_repository.dart';
import 'package:pomagai_app/features/settings/application/app_settings_controller.dart';

void main() {
  test(
    'tema, zvuk i pismo ostaju sačuvani posle ponovnog učitavanja',
    () async {
      final store = JsonProgressStore();
      final first = AppSettingsController();
      await first.configure(store);
      await first.setThemeMode(ThemeMode.dark);
      await first.setSoundEnabled(false);
      await first.setLatinPreferred(true);

      final restored = AppSettingsController();
      await restored.configure(store);

      expect(restored.settings.themeMode, ThemeMode.dark);
      expect(restored.settings.soundEnabled, isFalse);
      expect(restored.settings.latinPreferred, isTrue);
      expect(restored.settings.fullContentUnlocked, isTrue);
    },
  );
}
