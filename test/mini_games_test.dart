import 'package:flutter_test/flutter_test.dart';
import 'package:pomagai_app/features/games/domain/letter_game_engine.dart';

void main() {
  test('tri mini-igre imaju rezultat, povratnu informaciju i ponavljanje', () {
    for (final kind in LetterGameKind.values) {
      final game = LetterGameEngine(kind: kind, seed: 7);
      final round = game.newRound();
      final wrong = round.options.firstWhere(
        (option) => option.id != round.target.id,
      );
      expect(game.answer(round, wrong).correct, isFalse);
      expect(game.score, 0);
      expect(game.answer(round, round.target).correct, isTrue);
      expect(game.score, 1);
      expect(game.newRound().options, isNotEmpty);
    }
  });
}
