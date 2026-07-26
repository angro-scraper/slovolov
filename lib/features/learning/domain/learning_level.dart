enum LearningLevel {
  preschool(
    label: '3–5 godina',
    title: 'Mali istraživači',
    description: 'Slova, glasovi, crtanje i prepoznavanje.',
  ),
  earlySchool(
    label: '6–8 godina',
    title: 'Prvi čitači',
    description: 'Slogovi, reči, rečenice i kratki kvizovi.',
  ),
  wordExplorer(
    label: '8–10 godina',
    title: 'Majstori reči',
    description: 'Pravopis, razumevanje i izazovi sa rečima.',
  );

  const LearningLevel({
    required this.label,
    required this.title,
    required this.description,
  });

  final String label;
  final String title;
  final String description;
}
