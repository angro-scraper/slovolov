import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pomagai_app/features/learning/data/local_learning_repository.dart';
import 'package:pomagai_app/features/learning/data/serbian_letter_catalog.dart';
import 'package:pomagai_app/features/parent/application/parent_dashboard_service.dart';
import 'package:pomagai_app/features/parent/domain/audit_entry.dart';
import 'package:pomagai_app/features/parent/presentation/parent_dashboard.dart';
import 'package:pomagai_app/main.dart';

void main() {
  testWidgets(
    'korisnik završava lekciju kroz stvarni UI dok dete crta stvarne poteze slova',
    (tester) async {
      await tester.binding.setSurfaceSize(const Size(420, 900));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      await tester.pumpWidget(
        ProviderScope(child: SlovoIgraApp(store: JsonProgressStore())),
      );

      await tester.tap(find.widgetWithText(FilledButton, 'Uči slova'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('А').first);
      await tester.pumpAndSettle();
      expect(find.text('А а'), findsOneWidget);

      final trace = find.byKey(const ValueKey('letter-trace-canvas'));
      await tester.ensureVisible(trace);
      await tester.pump();
      final traceRect = tester.getRect(trace);
      Future<void> drawSegment(Offset start, Offset end) async {
        final gesture = await tester.startGesture(start);
        for (var step = 1; step <= 24; step++) {
          await gesture.moveTo(Offset.lerp(start, end, step / 24)!);
        }
        await gesture.up();
        await tester.pump();
      }

      await drawSegment(
        Offset(
          traceRect.left + traceRect.width * .20,
          traceRect.top + traceRect.height * .86,
        ),
        Offset(
          traceRect.left + traceRect.width * .50,
          traceRect.top + traceRect.height * .14,
        ),
      );
      await drawSegment(
        Offset(
          traceRect.left + traceRect.width * .50,
          traceRect.top + traceRect.height * .14,
        ),
        Offset(
          traceRect.left + traceRect.width * .80,
          traceRect.top + traceRect.height * .86,
        ),
      );
      await drawSegment(
        Offset(
          traceRect.left + traceRect.width * .33,
          traceRect.top + traceRect.height * .58,
        ),
        Offset(
          traceRect.left + traceRect.width * .67,
          traceRect.top + traceRect.height * .58,
        ),
      );
      await tester.pump();
      final accuracyText = tester
          .widget<Text>(find.byKey(const ValueKey('trace-accuracy')))
          .data!;
      final measuredAccuracy = int.parse(accuracyText.split('%').first);
      expect(measuredAccuracy, greaterThanOrEqualTo(75));

      final verify = find.widgetWithText(FilledButton, 'Proveri potez');
      await tester.ensureVisible(verify);
      await tester.pump();
      await tester.tap(verify);
      await tester.pump();
      await tester.runAsync(
        () => Future<void>.delayed(const Duration(milliseconds: 20)),
      );
      await tester.pump(const Duration(milliseconds: 900));
      expect(
        tester
            .widgetList<Text>(find.byType(Text))
            .map((widget) => widget.data)
            .whereType<String>(),
        contains('Bravo! Naučio si slovo А!'),
      );
      await tester.tap(find.text('Nazad na slova'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Nagrade'));
      await tester.pumpAndSettle();
      expect(find.text('3 zvezdice'), findsOneWidget);
      await tester.dragUntilVisible(
        find.text('Avion nalepnica'),
        find.byType(ListView),
        const Offset(0, -250),
      );
      expect(find.text('Avion nalepnica'), findsOneWidget);
    },
  );

  testWidgets('crtanje slova zaključava skrol i potez ostaje na platnu', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(420, 900));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      ProviderScope(child: SlovoIgraApp(store: JsonProgressStore())),
    );

    await tester.tap(find.widgetWithText(FilledButton, 'Uči slova'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('А').first);
    await tester.pumpAndSettle();

    final trace = find.byKey(const ValueKey('letter-trace-canvas'));
    await tester.ensureVisible(trace);
    await tester.pump();
    final scrollable = find
        .ancestor(of: trace, matching: find.byType(Scrollable))
        .first;
    final scrollPosition = tester.state<ScrollableState>(scrollable).position;
    final pixelsBefore = scrollPosition.pixels;
    final rect = tester.getRect(trace);

    final gesture = await tester.startGesture(
      Offset(rect.left + rect.width * .20, rect.top + rect.height * .86),
    );
    for (var step = 1; step <= 24; step++) {
      await gesture.moveTo(
        Offset.lerp(
          Offset(rect.left + rect.width * .20, rect.top + rect.height * .86),
          Offset(rect.left + rect.width * .50, rect.top + rect.height * .14),
          step / 24,
        )!,
      );
      await tester.pump(const Duration(milliseconds: 4));
    }
    await gesture.up();
    await tester.pump();

    expect(scrollPosition.pixels, closeTo(pixelsBefore, .01));
    final accuracyText = tester
        .widget<Text>(find.byKey(const ValueKey('trace-accuracy')))
        .data!;
    expect(int.parse(accuracyText.split('%').first), greaterThan(0));
  });

  testWidgets('roditelj vidi samo stvarne lokalne metrike', (tester) async {
    final repository = LocalLearningRepository(JsonProgressStore());
    await repository.markCompleted('dete-1', 'a', stars: 3);
    await repository.addLearningTime('dete-1', const Duration(minutes: 4));
    final service = ParentDashboardService(repository);

    await tester.pumpWidget(
      MaterialApp(
        home: ParentDashboard(
          service: service,
          role: LocalRole.parent,
          childId: 'dete-1',
          lessons: SerbianLetterCatalog.lessons,
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('1/30'), findsOneWidget);
    expect(find.text('3'), findsOneWidget);
    expect(find.text('4 min'), findsOneWidget);
  });

  testWidgets('bojanka prima potez, čuva i briše crtež', (tester) async {
    await tester.binding.setSurfaceSize(const Size(420, 900));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      ProviderScope(child: SlovoIgraApp(store: JsonProgressStore())),
    );

    await tester.ensureVisible(find.byKey(const ValueKey('home-coloring')));
    await tester.pump();
    await tester.tap(find.byKey(const ValueKey('home-coloring')));
    await tester.pumpAndSettle();
    expect(find.text('Bojanka po slovima'), findsOneWidget);

    final canvas = find.byKey(const ValueKey('coloring-canvas'));
    expect(canvas, findsOneWidget);
    await tester.dragFrom(tester.getCenter(canvas), const Offset(60, 40));
    await tester.pump();
    expect(find.text('1 potez'), findsOneWidget);

    await tester.tap(find.text('Sačuvaj crtež'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));
    expect(find.textContaining('Sačuvano'), findsOneWidget);
    expect(
      find.text('Crtež je trajno sačuvan na ovom uređaju.'),
      findsOneWidget,
    );

    await tester.ensureVisible(find.text('Obriši crtež'));
    await tester.pump();
    await tester.tap(find.text('Obriši crtež'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Nastavi'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Obriši'));
    await tester.pumpAndSettle();
    expect(find.text('0 poteza'), findsOneWidget);
  });

  testWidgets('bojanka ne pomera ekran dok dete crta', (tester) async {
    await tester.binding.setSurfaceSize(const Size(420, 900));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      ProviderScope(child: SlovoIgraApp(store: JsonProgressStore())),
    );

    await tester.ensureVisible(find.byKey(const ValueKey('home-coloring')));
    await tester.pump();
    await tester.tap(find.byKey(const ValueKey('home-coloring')));
    await tester.pumpAndSettle();

    final canvas = find.byKey(const ValueKey('coloring-canvas'));
    final scrollable = find
        .ancestor(of: canvas, matching: find.byType(Scrollable))
        .first;
    final scrollPosition = tester.state<ScrollableState>(scrollable).position;
    final pixelsBefore = scrollPosition.pixels;
    final rect = tester.getRect(canvas);
    final gesture = await tester.startGesture(
      Offset(rect.center.dx, rect.bottom - 30),
    );
    await gesture.moveTo(Offset(rect.center.dx, rect.top + 30));
    await tester.pump();
    await gesture.up();
    await tester.pump();

    expect(scrollPosition.pixels, closeTo(pixelsBefore, .01));
    expect(find.text('1 potez'), findsOneWidget);
  });

  testWidgets('roditeljski panel je zaštićen i sadržaj je potpuno dostupan', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(430, 900));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      ProviderScope(child: SlovoIgraApp(store: JsonProgressStore())),
    );

    await tester.tap(find.text('Roditelji'));
    await tester.pumpAndSettle();
    expect(find.text('Koliko je 7 + 5?'), findsOneWidget);
    await tester.enterText(
      find.byKey(const ValueKey('parent-gate-answer')),
      '12',
    );
    await tester.tap(find.byKey(const ValueKey('parent-gate-confirm')));
    await tester.pumpAndSettle();

    expect(find.text('Cela aplikacija je dostupna'), findsOneWidget);
    expect(
      find.text('Plaćanje i zaključavanje sadržaja su isključeni.'),
      findsOneWidget,
    );
  });

  testWidgets('nedozvoljena uloga je blokirana', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: ParentDashboard(
          service: ParentDashboardService(
            LocalLearningRepository(JsonProgressStore()),
          ),
          role: LocalRole.child,
          childId: 'dete-1',
          lessons: SerbianLetterCatalog.lessons,
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Pristup nije dozvoljen'), findsOneWidget);
  });

  test('pretraga, filter i upravljačka izmena su auditovani', () async {
    final repository = LocalLearningRepository(JsonProgressStore());
    await repository.markCompleted('dete-1', 'a');
    final service = ParentDashboardService(repository);
    final filtered = await service.searchLessons(
      role: LocalRole.parent,
      childId: 'dete-1',
      lessons: SerbianLetterCatalog.lessons,
      query: 'avion',
      onlyCompleted: true,
    );
    expect(filtered.single.id, 'a');

    service.updateDailyGoal(
      role: LocalRole.parent,
      actorId: 'roditelj-1',
      childId: 'dete-1',
      minutes: 20,
    );
    final audit = service.auditHistory(LocalRole.parent);
    expect(audit.single.action, 'daily_goal_updated');
    expect(audit.single.detail, contains('minutes=20'));
  });
}
