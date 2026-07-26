enum RewardKind { sticker, star, medal }

class Reward {
  const Reward({
    required this.id,
    required this.title,
    required this.kind,
    required this.emoji,
  });

  final String id;
  final String title;
  final RewardKind kind;
  final String emoji;
}
