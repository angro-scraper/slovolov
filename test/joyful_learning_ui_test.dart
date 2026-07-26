import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pomagai_app/features/learning/data/local_learning_repository.dart';
import 'package:pomagai_app/main.dart';

void main() {
  testWidgets('dete bira pismo i vidi tačna latinična slova', (tester) async {
    await tester.binding.setSurfaceSize(const Size(430, 900));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      ProviderScope(child: SlovoIgraApp(store: JsonProgressStore())),
    );

    await tester.tap(find.widgetWithText(FilledButton, 'Uči slova'));
    await tester.pumpAndSettle();
    expect(find.text('Љ'), findsOneWidget);

    await tester.tap(find.text('Latinica'));
    await tester.pumpAndSettle();
    expect(find.byIcon(Icons.lock_rounded), findsNothing);
    expect(find.text('Lj'), findsOneWidget);
    expect(find.text('Nj'), findsOneWidget);
    await tester.dragUntilVisible(
      find.text('Dž'),
      find.byType(CustomScrollView),
      const Offset(0, -300),
    );
    expect(find.text('Dž'), findsOneWidget);
  });

  testWidgets('starije dete otvara slogove i priče', (tester) async {
    await tester.binding.setSurfaceSize(const Size(430, 900));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      ProviderScope(child: SlovoIgraApp(store: JsonProgressStore())),
    );

    await tester.dragUntilVisible(
      find.text('Reči i priče'),
      find.byType(CustomScrollView),
      const Offset(0, -400),
    );
    await tester.drag(find.byType(CustomScrollView), const Offset(0, -240));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Reči i priče'));
    await tester.pumpAndSettle();

    expect(find.text('Učenje raste sa detetom'), findsOneWidget);
    expect(find.text('6–8 godina'), findsOneWidget);
    expect(find.textContaining('Slogovi:'), findsOneWidget);
    expect(find.text('Poslušaj'), findsOneWidget);

    await tester.tap(find.text('8–10 godina'));
    await tester.pumpAndSettle();
    expect(find.textContaining('Pronađi još jednu reč'), findsOneWidget);
  });
}
