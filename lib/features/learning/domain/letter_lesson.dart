enum ScriptMode { cyrillic, latin }

class LetterLesson {
  const LetterLesson({
    required this.id,
    required this.cyrillicUpper,
    required this.cyrillicLower,
    required this.latinUpper,
    required this.latinLower,
    required this.word,
    required this.emoji,
    required this.isFree,
  });

  final String id;
  final String cyrillicUpper;
  final String cyrillicLower;
  final String latinUpper;
  final String latinLower;
  final String word;
  final String emoji;
  final bool isFree;

  /// Katalog zadržava jednu kanonsku reč na latinici, a prikaz uvek prati
  /// izabrano pismo. Time se ne može desiti da dete uz slovo М vidi `Meda`.
  String wordFor(ScriptMode mode) =>
      mode == ScriptMode.cyrillic ? _toCyrillic(word) : word;

  String spokenPromptFor(ScriptMode mode) =>
      '${upper(mode)} ${mode == ScriptMode.cyrillic ? 'као' : 'kao'} ${wordFor(mode).toLowerCase()}';

  String get spokenPrompt => spokenPromptFor(ScriptMode.cyrillic);

  List<String> get syllables {
    final normalized = word.toLowerCase();
    if (normalized.length <= 3) return <String>[normalized];
    final vowels = <String>{'a', 'e', 'i', 'o', 'u'};
    final result = <String>[];
    var current = '';
    for (var index = 0; index < normalized.length; index++) {
      current += normalized[index];
      if (vowels.contains(normalized[index]) &&
          index < normalized.length - 1 &&
          (index + 1 == normalized.length - 1 ||
              !vowels.contains(normalized[index + 1]))) {
        result.add(current);
        current = '';
      }
    }
    if (current.isNotEmpty) {
      if (result.isEmpty) {
        result.add(current);
      } else {
        result[result.length - 1] += current;
      }
    }
    return result;
  }

  String get sentence => '$word je reč koja počinje ovim slovom.';

  String get challengeQuestion =>
      'Pronađi još jednu reč koja počinje slovom $cyrillicUpper.';

  String upper(ScriptMode mode) =>
      mode == ScriptMode.cyrillic ? cyrillicUpper : latinUpper;

  String lower(ScriptMode mode) =>
      mode == ScriptMode.cyrillic ? cyrillicLower : latinLower;

  static String _toCyrillic(String value) {
    final digraphs = <String, String>{
      'Dž': 'Џ', 'dž': 'џ', 'Lj': 'Љ', 'lj': 'љ', 'Nj': 'Њ', 'nj': 'њ',
    };
    var result = value;
    digraphs.forEach((latin, cyrillic) => result = result.replaceAll(latin, cyrillic));
    const letters = <String, String>{
      'A': 'А', 'a': 'а', 'B': 'Б', 'b': 'б', 'V': 'В', 'v': 'в',
      'G': 'Г', 'g': 'г', 'D': 'Д', 'd': 'д', 'Đ': 'Ђ', 'đ': 'ђ',
      'E': 'Е', 'e': 'е', 'Ž': 'Ж', 'ž': 'ж', 'Z': 'З', 'z': 'з',
      'I': 'И', 'i': 'и', 'J': 'Ј', 'j': 'ј', 'K': 'К', 'k': 'к',
      'L': 'Л', 'l': 'л', 'M': 'М', 'm': 'м', 'N': 'Н', 'n': 'н',
      'O': 'О', 'o': 'о', 'P': 'П', 'p': 'п', 'R': 'Р', 'r': 'р',
      'S': 'С', 's': 'с', 'T': 'Т', 't': 'т', 'Ć': 'Ћ', 'ć': 'ћ',
      'U': 'У', 'u': 'у', 'F': 'Ф', 'f': 'ф', 'H': 'Х', 'h': 'х',
      'C': 'Ц', 'c': 'ц', 'Č': 'Ч', 'č': 'ч', 'Š': 'Ш', 'š': 'ш',
    };
    return result.split('').map((character) => letters[character] ?? character).join();
  }
}
