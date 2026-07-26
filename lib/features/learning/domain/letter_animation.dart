enum LetterAnimationKind { fly, rise, bounce, sway, spin, pulse }

class LetterAnimation {
  const LetterAnimation({required this.kind, required this.label});

  final LetterAnimationKind kind;
  final String label;

  static const _special = <String, LetterAnimation>{
    'a': LetterAnimation(
      kind: LetterAnimationKind.fly,
      label: 'Avion poleće preko neba',
    ),
    'b': LetterAnimation(
      kind: LetterAnimationKind.rise,
      label: 'Baloni lete nagore',
    ),
    'v': LetterAnimation(
      kind: LetterAnimationKind.bounce,
      label: 'Vuk veselo poskakuje',
    ),
    'g': LetterAnimation(kind: LetterAnimationKind.fly, label: 'Golub leti'),
    'd': LetterAnimation(
      kind: LetterAnimationKind.sway,
      label: 'Drvo se njiše na vetru',
    ),
    'dj': LetterAnimation(
      kind: LetterAnimationKind.bounce,
      label: 'Đak veselo poskakuje',
    ),
    'e': LetterAnimation(
      kind: LetterAnimationKind.spin,
      label: 'Ekser se okreće',
    ),
    'zh': LetterAnimation(
      kind: LetterAnimationKind.bounce,
      label: 'Žaba skače',
    ),
    'z': LetterAnimation(
      kind: LetterAnimationKind.bounce,
      label: 'Zec skakuće',
    ),
    'i': LetterAnimation(
      kind: LetterAnimationKind.sway,
      label: 'Igračka pleše',
    ),
    'j': LetterAnimation(
      kind: LetterAnimationKind.spin,
      label: 'Jabuka se kotrlja',
    ),
    'k': LetterAnimation(
      kind: LetterAnimationKind.pulse,
      label: 'Kuća svetluca',
    ),
    'l': LetterAnimation(
      kind: LetterAnimationKind.pulse,
      label: 'Lav veselo riče',
    ),
    'lj': LetterAnimation(
      kind: LetterAnimationKind.sway,
      label: 'Ljuljaška se ljulja',
    ),
    'm': LetterAnimation(kind: LetterAnimationKind.sway, label: 'Meda maše'),
    'n': LetterAnimation(
      kind: LetterAnimationKind.bounce,
      label: 'Nos se smešno mrda',
    ),
    'nj': LetterAnimation(
      kind: LetterAnimationKind.sway,
      label: 'Njiva talasa na vetru',
    ),
    'o': LetterAnimation(
      kind: LetterAnimationKind.bounce,
      label: 'Ovan veselo poskakuje',
    ),
    'p': LetterAnimation(
      kind: LetterAnimationKind.sway,
      label: 'Pas veselo maše repom',
    ),
    'r': LetterAnimation(kind: LetterAnimationKind.sway, label: 'Riba pliva'),
    's': LetterAnimation(kind: LetterAnimationKind.pulse, label: 'Sunce sija'),
    't': LetterAnimation(kind: LetterAnimationKind.sway, label: 'Traktor vozi'),
    'tj': LetterAnimation(
      kind: LetterAnimationKind.bounce,
      label: 'Ćurka veselo igra',
    ),
    'u': LetterAnimation(
      kind: LetterAnimationKind.pulse,
      label: 'Uvo pažljivo sluša',
    ),
    'f': LetterAnimation(kind: LetterAnimationKind.sway, label: 'Foka pliva'),
    'h': LetterAnimation(
      kind: LetterAnimationKind.bounce,
      label: 'Hleb poskakuje',
    ),
    'c': LetterAnimation(
      kind: LetterAnimationKind.pulse,
      label: 'Cvet se otvara',
    ),
    'ch': LetterAnimation(kind: LetterAnimationKind.sway, label: 'Čamac plovi'),
    'dzh': LetterAnimation(
      kind: LetterAnimationKind.bounce,
      label: 'Džem veselo poskakuje',
    ),
    'sh': LetterAnimation(
      kind: LetterAnimationKind.sway,
      label: 'Šuma se njiše',
    ),
  };

  static LetterAnimation forLetter(String id) {
    final special = _special[id];
    if (special != null) return special;
    return const LetterAnimation(
      kind: LetterAnimationKind.pulse,
      label: 'Ilustracija oživljava',
    );
  }
}
