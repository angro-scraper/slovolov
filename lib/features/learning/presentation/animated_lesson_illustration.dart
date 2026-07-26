import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../domain/letter_animation.dart';
import '../domain/letter_lesson.dart';

class AnimatedLessonIllustration extends StatefulWidget {
  const AnimatedLessonIllustration({super.key, required this.lesson});

  final LetterLesson lesson;

  @override
  State<AnimatedLessonIllustration> createState() =>
      _AnimatedLessonIllustrationState();
}

class _AnimatedLessonIllustrationState extends State<AnimatedLessonIllustration>
    with SingleTickerProviderStateMixin {
  late final AnimationController controller;
  late final LetterAnimation animation;

  @override
  void initState() {
    super.initState();
    animation = LetterAnimation.forLetter(widget.lesson.id);
    controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..forward();
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  Offset _offset(double value) => switch (animation.kind) {
    LetterAnimationKind.fly => Offset(
      -34 + value * 68,
      -12 * math.sin(value * math.pi),
    ),
    LetterAnimationKind.rise => Offset(0, 28 - value * 56),
    LetterAnimationKind.bounce => Offset(
      0,
      -22 * math.sin(value * math.pi * 2),
    ),
    LetterAnimationKind.sway => Offset(24 * math.sin(value * math.pi * 2), 0),
    LetterAnimationKind.spin || LetterAnimationKind.pulse => Offset.zero,
  };

  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    label: '${animation.label}. Dodirni da ponoviš animaciju.',
    child: InkWell(
      key: const ValueKey('lesson-illustration-animation'),
      borderRadius: BorderRadius.circular(20),
      onTap: () => controller.forward(from: 0),
      child: SizedBox.square(
        dimension: 92,
        child: AnimatedBuilder(
          animation: controller,
          builder: (context, child) {
            final value = Curves.easeInOut.transform(controller.value);
            final scale = animation.kind == LetterAnimationKind.pulse
                ? .88 + .18 * math.sin(value * math.pi)
                : 1.0;
            final angle = animation.kind == LetterAnimationKind.spin
                ? value * math.pi * 2
                : 0.0;
            return Transform.translate(
              offset: _offset(value),
              child: Transform.rotate(
                angle: angle,
                child: Transform.scale(scale: scale, child: child),
              ),
            );
          },
          child: Center(
            child: Text(
              widget.lesson.emoji,
              style: const TextStyle(fontSize: 58),
            ),
          ),
        ),
      ),
    ),
  );
}
