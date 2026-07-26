import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pomagai_app/features/learning/data/local_learning_repository.dart';
import 'package:pomagai_app/main.dart';

void main() {
  testWidgets('glavni ekran je responsive i pristupačan', (tester) async {
    final semantics = tester.ensureSemantics();
    try {
      for (final size in <Size>[const Size(360, 640), const Size(1024, 1366)]) {
        await tester.binding.setSurfaceSize(size);
        await tester.pumpWidget(
          ProviderScope(child: SlovoIgraApp(store: JsonProgressStore())),
        );
        await tester.pumpAndSettle();
        expect(
          find.bySemanticsLabel('Početni ekran edukativne aplikacije Slovolov'),
          findsOneWidget,
        );
        expect(tester.takeException(), isNull);
      }
    } finally {
      await tester.binding.setSurfaceSize(null);
      semantics.dispose();
    }
  });

  test('offline ugovor i release dokument postoje', () {
    final mainSource = File('lib/main.dart').readAsStringSync();
    final release = File('docs/APP_FACTORY_RELEASE.md').readAsStringSync();
    expect(mainSource, isNot(contains("package:http")));
    expect(mainSource, isNot(contains('http://')));
    expect(release, contains('Bez deploy-a'));
    expect(release, contains('Poznata ograničenja'));
    expect(release, contains('Rollback'));
  });
}
