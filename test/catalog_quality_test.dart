import 'package:flutter_test/flutter_test.dart';
import 'package:pomagai_app/features/learning/data/serbian_letter_catalog.dart';
import 'package:pomagai_app/features/learning/domain/letter_lesson.dart';

void main() {
  test('katalog sadrži tačnu srpsku azbuku i abecedu', () {
    final lessons = SerbianLetterCatalog.lessons;

    expect(lessons.length, 30);
    expect(
      lessons.map((lesson) => lesson.cyrillicUpper).join(' '),
      'А Б В Г Д Ђ Е Ж З И Ј К Л Љ М Н Њ О П Р С Т Ћ У Ф Х Ц Ч Џ Ш',
    );
    expect(
      lessons.map((lesson) => lesson.latinUpper).join(' '),
      'A B V G D Đ E Ž Z I J K L Lj M N Nj O P R S T Ć U F H C Č Dž Š',
    );
    expect(lessons.map((lesson) => lesson.id).toSet().length, 30);
    expect(lessons.every((lesson) => lesson.word.trim().isNotEmpty), isTrue);
  });

  test('svaka lekcija prikazuje oba pisma bez menjanja značenja', () {
    final lj = SerbianLetterCatalog.byId('lj');
    final nj = SerbianLetterCatalog.byId('nj');
    final dz = SerbianLetterCatalog.byId('dzh');

    expect(lj.upper(ScriptMode.cyrillic), 'Љ');
    expect(lj.upper(ScriptMode.latin), 'Lj');
    expect(nj.upper(ScriptMode.latin), 'Nj');
    expect(dz.upper(ScriptMode.latin), 'Dž');
    expect(lj.spokenPrompt, 'Љ kao ljuljaška');
  });
}
