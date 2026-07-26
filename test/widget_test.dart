import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pomagai_app/main.dart';

void main() {
  testWidgets('prikazuje glavni edukativni tok', (tester) async {
    await tester.binding.setSurfaceSize(const Size(1200, 1000));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(const ProviderScope(child: SlovoIgraApp()));

    expect(find.text('Slovolov'), findsOneWidget);
    expect(find.text('Uči slova'), findsWidgets);
    expect(find.text('Nagrade'), findsOneWidget);
    expect(
      find.bySemanticsLabel('Početni ekran edukativne aplikacije Slovolov'),
      findsOneWidget,
    );
  });

}
