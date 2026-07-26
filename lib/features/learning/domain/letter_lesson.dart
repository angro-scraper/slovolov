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

  String get spokenPrompt => '$cyrillicUpper kao ${word.toLowerCase()}';

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
}
