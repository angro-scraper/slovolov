import 'package:flutter/material.dart';

import '../../learning/domain/letter_lesson.dart';
import '../../settings/application/app_settings_controller.dart';
import '../application/parent_dashboard_service.dart';
import '../domain/audit_entry.dart';

class ParentDashboard extends StatelessWidget {
  const ParentDashboard({
    super.key,
    required this.service,
    required this.role,
    required this.childId,
    required this.lessons,
    this.settingsController,
    this.onReset,
  });

  final ParentDashboardService service;
  final LocalRole role;
  final String childId;
  final List<LetterLesson> lessons;
  final AppSettingsController? settingsController;
  final Future<void> Function()? onReset;

  Future<void> _confirmReset(BuildContext context) async {
    final first = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Resetuj sav napredak?'),
        content: const Text('Slova, zvezdice i vreme učenja biće obrisani.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Odustani'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Nastavi'),
          ),
        ],
      ),
    );
    if (first != true || !context.mounted) return;
    final second = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Druga potvrda'),
        content: const Text('Da li ste sigurni da želite prazan profil?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Ne'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Da, resetuj'),
          ),
        ],
      ),
    );
    if (second == true) await onReset?.call();
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Roditeljski pregled napretka',
      child: FutureBuilder<ParentOverview>(
        future: service.overview(
          role: role,
          childId: childId,
          totalLetters: lessons.length,
        ),
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.error is PermissionDenied) {
            return const Center(child: Text('Pristup nije dozvoljen'));
          }
          if (snapshot.hasError) {
            return const Center(child: Text('Napredak trenutno nije dostupan'));
          }
          final overview = snapshot.requireData;
          return ListView(
            padding: const EdgeInsets.all(24),
            children: [
              Text(
                'Napredak deteta',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 16),
              _Metric(
                label: 'Naučena slova',
                value: '${overview.learnedLetters}/${overview.totalLetters}',
              ),
              _Metric(label: 'Zvezdice', value: '${overview.stars}'),
              _Metric(
                label: 'Vreme učenja',
                value: '${overview.learningSeconds ~/ 60} min',
              ),
              _Metric(
                label: 'Dnevni cilj',
                value: '${overview.dailyGoalMinutes} min',
              ),
              const SizedBox(height: 16),
              Text(
                'Napredak po slovima',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Material(
                type: MaterialType.transparency,
                child: Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    for (final lesson in lessons)
                      Chip(
                        avatar: Icon(
                          overview.completedLessonIds.contains(lesson.id)
                              ? Icons.check_circle_rounded
                              : Icons.lock_outline_rounded,
                          size: 18,
                        ),
                        label: Text(lesson.cyrillicUpper),
                      ),
                  ],
                ),
              ),
              if (settingsController case final controller?) ...[
                const SizedBox(height: 20),
                Text(
                  'Podešavanja',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                AnimatedBuilder(
                  animation: controller,
                  builder: (context, _) => Column(
                    children: [
                      SwitchListTile(
                        title: const Text('Zvuk i objašnjenja'),
                        value: controller.settings.soundEnabled,
                        onChanged: controller.setSoundEnabled,
                      ),
                      SwitchListTile(
                        title: const Text('Latinica kao početno pismo'),
                        value: controller.settings.latinPreferred,
                        onChanged: controller.setLatinPreferred,
                      ),
                      SwitchListTile(
                        title: const Text('Tamna tema'),
                        value: controller.settings.themeMode == ThemeMode.dark,
                        onChanged: (value) => controller.setThemeMode(
                          value ? ThemeMode.dark : ThemeMode.light,
                        ),
                      ),
                      const ListTile(
                        leading: Icon(Icons.lock_open_rounded),
                        title: Text('Cela aplikacija je dostupna'),
                        subtitle: Text(
                          'Plaćanje i zaključavanje sadržaja su isključeni.',
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              if (onReset != null)
                OutlinedButton.icon(
                  onPressed: () => _confirmReset(context),
                  icon: const Icon(Icons.restart_alt_rounded),
                  label: const Text('Resetuj napredak'),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Card(
    child: ListTile(
      title: Text(label),
      trailing: Text(value, style: Theme.of(context).textTheme.titleLarge),
    ),
  );
}
