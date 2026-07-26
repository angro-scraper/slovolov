import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pomagai_app/features/learning/data/local_learning_repository.dart';
import 'package:pomagai_app/features/learning/data/serbian_letter_catalog.dart';
import 'package:pomagai_app/features/learning/presentation/animated_lesson_illustration.dart';
import 'package:pomagai_app/main.dart';

Widget testApp() =>
    ProviderScope(child: SlovoIgraApp(store: JsonProgressStore()));

void main() {
  testWidgets('A avion i B baloni imaju stvarne animirane ilustracije', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(430, 900));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: AnimatedLessonIllustration(
            lesson: SerbianLetterCatalog.byId('a'),
          ),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 250));
    expect(
      find.byKey(const ValueKey('lesson-illustration-animation')),
      findsOneWidget,
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: AnimatedLessonIllustration(
            lesson: SerbianLetterCatalog.byId('b'),
          ),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 250));
    expect(
      find.byKey(const ValueKey('lesson-illustration-animation')),
      findsOneWidget,
    );
  });

  testWidgets('mini-igre nude tri stvarna lokalna toka i rezultat', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(430, 900));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(testApp());

    final miniGamesCard = find.byKey(const ValueKey('home-mini-games'));
    await tester.dragUntilVisible(
      miniGamesCard,
      find.byType(CustomScrollView),
      const Offset(0, -350),
    );
    await tester.ensureVisible(miniGamesCard);
    await tester.pump();
    final miniGamesTap = find.descendant(
      of: miniGamesCard,
      matching: find.byType(InkWell),
    );
    await tester.tap(miniGamesTap);
    await tester.pumpAndSettle();
    expect(find.text('Slika'), findsOneWidget);
    expect(find.text('Slovo'), findsOneWidget);
    expect(find.text('Baloni'), findsOneWidget);
    expect(find.textContaining('Rezultat: 0'), findsOneWidget);

    await tester.tap(find.text('Baloni'));
    await tester.pump(const Duration(milliseconds: 250));
    expect(find.bySemanticsLabel(RegExp('Balon sa slovom')), findsWidgets);
    expect(find.text('Igraj ponovo'), findsOneWidget);
  });

  testWidgets('roditelj može da uključi tamnu temu koja ostaje aktivna', (
    tester,
  ) async {
    final store = JsonProgressStore();
    await tester.binding.setSurfaceSize(const Size(430, 900));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(ProviderScope(child: SlovoIgraApp(store: store)));

    await tester.tap(find.text('Roditelji'));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.byKey(const ValueKey('parent-gate-answer')),
      '12',
    );
    await tester.tap(find.byKey(const ValueKey('parent-gate-confirm')));
    await tester.pumpAndSettle();
    final themeSwitch = find.widgetWithText(SwitchListTile, 'Tamna tema');
    await tester.ensureVisible(themeSwitch);
    await tester.pump();
    await tester.tap(themeSwitch);
    await tester.pumpAndSettle();

    final material = tester.widget<MaterialApp>(find.byType(MaterialApp));
    expect(material.themeMode, ThemeMode.dark);
  });
}
