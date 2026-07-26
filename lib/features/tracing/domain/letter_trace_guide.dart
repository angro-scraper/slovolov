import 'dart:math' as math;

import 'package:flutter/material.dart';

typedef NormalizedStroke = List<Offset>;

class LetterTraceGuide {
  const LetterTraceGuide(this.strokes);

  final List<NormalizedStroke> strokes;

  static const _guides = <String, List<NormalizedStroke>>{
    'a': [
      [Offset(.18, .88), Offset(.50, .12), Offset(.82, .88)],
      [Offset(.32, .58), Offset(.68, .58)],
    ],
    'b': [
      [Offset(.25, .88), Offset(.25, .14), Offset(.76, .14)],
      [
        Offset(.25, .48),
        Offset(.62, .48),
        Offset(.78, .62),
        Offset(.72, .84),
        Offset(.25, .88),
      ],
    ],
    'v': [
      [Offset(.24, .12), Offset(.24, .88)],
      [
        Offset(.24, .12),
        Offset(.66, .12),
        Offset(.78, .28),
        Offset(.65, .47),
        Offset(.24, .47),
      ],
      [
        Offset(.24, .47),
        Offset(.68, .47),
        Offset(.80, .68),
        Offset(.67, .88),
        Offset(.24, .88),
      ],
    ],
    'g': [
      [Offset(.75, .14), Offset(.25, .14), Offset(.25, .88)],
    ],
    'd': [
      [
        Offset(.18, .82),
        Offset(.30, .82),
        Offset(.40, .16),
        Offset(.72, .16),
        Offset(.78, .82),
        Offset(.88, .82),
      ],
      [Offset(.14, .82), Offset(.14, .94)],
      [Offset(.88, .82), Offset(.88, .94)],
    ],
    'dj': [
      [Offset(.16, .20), Offset(.82, .20)],
      [Offset(.38, .10), Offset(.38, .88)],
      [
        Offset(.38, .52),
        Offset(.70, .52),
        Offset(.82, .66),
        Offset(.75, .88),
        Offset(.58, .92),
      ],
    ],
    'e': [
      [Offset(.74, .14), Offset(.24, .14), Offset(.24, .88), Offset(.74, .88)],
      [Offset(.24, .50), Offset(.64, .50)],
    ],
    'zh': [
      [Offset(.16, .14), Offset(.50, .50), Offset(.16, .88)],
      [Offset(.50, .14), Offset(.50, .88)],
      [Offset(.84, .14), Offset(.50, .50), Offset(.84, .88)],
    ],
    'z': [
      [
        Offset(.26, .20),
        Offset(.44, .12),
        Offset(.72, .18),
        Offset(.76, .36),
        Offset(.60, .50),
      ],
      [
        Offset(.60, .50),
        Offset(.78, .62),
        Offset(.72, .84),
        Offset(.44, .90),
        Offset(.22, .80),
      ],
    ],
    'i': [
      [Offset(.24, .14), Offset(.24, .88), Offset(.76, .14), Offset(.76, .88)],
    ],
    'j': [
      [
        Offset(.64, .14),
        Offset(.64, .70),
        Offset(.56, .88),
        Offset(.32, .88),
        Offset(.22, .72),
      ],
    ],
    'k': [
      [Offset(.24, .12), Offset(.24, .88)],
      [Offset(.78, .14), Offset(.24, .54), Offset(.80, .88)],
    ],
    'l': [
      [Offset(.16, .88), Offset(.34, .14), Offset(.76, .14), Offset(.76, .88)],
    ],
    'lj': [
      [Offset(.10, .88), Offset(.24, .14), Offset(.54, .14), Offset(.54, .88)],
      [
        Offset(.54, .50),
        Offset(.76, .50),
        Offset(.88, .66),
        Offset(.82, .86),
        Offset(.54, .88),
      ],
    ],
    'm': [
      [
        Offset(.16, .88),
        Offset(.16, .14),
        Offset(.50, .56),
        Offset(.84, .14),
        Offset(.84, .88),
      ],
    ],
    'n': [
      [Offset(.22, .14), Offset(.22, .88)],
      [Offset(.22, .50), Offset(.78, .50)],
      [Offset(.78, .14), Offset(.78, .88)],
    ],
    'nj': [
      [Offset(.12, .14), Offset(.12, .88)],
      [Offset(.12, .50), Offset(.54, .50)],
      [Offset(.54, .14), Offset(.54, .88)],
      [
        Offset(.54, .50),
        Offset(.76, .50),
        Offset(.88, .66),
        Offset(.82, .86),
        Offset(.54, .88),
      ],
    ],
    'o': [
      [
        Offset(.50, .12),
        Offset(.28, .18),
        Offset(.18, .48),
        Offset(.24, .78),
        Offset(.50, .90),
        Offset(.76, .78),
        Offset(.82, .48),
        Offset(.72, .18),
        Offset(.50, .12),
      ],
    ],
    'p': [
      [Offset(.22, .88), Offset(.22, .14), Offset(.78, .14), Offset(.78, .88)],
    ],
    'r': [
      [Offset(.24, .88), Offset(.24, .14)],
      [
        Offset(.24, .14),
        Offset(.65, .14),
        Offset(.80, .30),
        Offset(.70, .50),
        Offset(.24, .50),
      ],
    ],
    's': [
      [
        Offset(.76, .22),
        Offset(.62, .12),
        Offset(.36, .14),
        Offset(.20, .36),
        Offset(.20, .66),
        Offset(.36, .88),
        Offset(.64, .88),
        Offset(.78, .76),
      ],
    ],
    't': [
      [Offset(.14, .14), Offset(.86, .14)],
      [Offset(.50, .14), Offset(.50, .88)],
    ],
    'tj': [
      [Offset(.12, .20), Offset(.78, .20)],
      [Offset(.34, .10), Offset(.34, .88)],
      [
        Offset(.34, .50),
        Offset(.68, .50),
        Offset(.80, .64),
        Offset(.76, .84),
        Offset(.60, .90),
      ],
    ],
    'u': [
      [Offset(.16, .14), Offset(.48, .66), Offset(.76, .14)],
      [Offset(.48, .66), Offset(.40, .84), Offset(.22, .88)],
    ],
    'f': [
      [Offset(.50, .08), Offset(.50, .94)],
      [
        Offset(.50, .24),
        Offset(.28, .16),
        Offset(.14, .34),
        Offset(.24, .56),
        Offset(.50, .54),
      ],
      [
        Offset(.50, .24),
        Offset(.72, .16),
        Offset(.86, .34),
        Offset(.76, .56),
        Offset(.50, .54),
      ],
    ],
    'h': [
      [Offset(.20, .14), Offset(.80, .88)],
      [Offset(.80, .14), Offset(.20, .88)],
    ],
    'c': [
      [Offset(.20, .14), Offset(.20, .88), Offset(.76, .88), Offset(.76, .14)],
      [Offset(.76, .88), Offset(.88, .88), Offset(.88, .98)],
    ],
    'ch': [
      [Offset(.20, .14), Offset(.20, .48), Offset(.72, .48)],
      [Offset(.72, .14), Offset(.72, .88)],
    ],
    'dzh': [
      [Offset(.16, .14), Offset(.16, .88), Offset(.48, .88), Offset(.48, .14)],
      [Offset(.48, .14), Offset(.48, .88), Offset(.78, .88), Offset(.78, .14)],
      [Offset(.78, .88), Offset(.90, .88), Offset(.90, .98)],
    ],
    'sh': [
      [Offset(.14, .14), Offset(.14, .88), Offset(.50, .88), Offset(.50, .14)],
      [Offset(.50, .14), Offset(.50, .88), Offset(.86, .88), Offset(.86, .14)],
    ],
  };

  static LetterTraceGuide forLetter(String id) {
    final strokes = _guides[id];
    if (strokes == null) {
      throw ArgumentError.value(id, 'id', 'Putanja slova nije pronađena.');
    }
    return LetterTraceGuide(strokes);
  }

  List<List<Offset>> scale(Size size) => strokes
      .map(
        (stroke) => stroke
            .map(
              (point) => Offset(point.dx * size.width, point.dy * size.height),
            )
            .toList(growable: false),
      )
      .toList(growable: false);

  double accuracy(List<List<Offset>> drawn, Size size) {
    if (drawn.isEmpty || size.isEmpty) return 0;
    final segments = <(Offset, Offset)>[];
    for (final stroke in drawn) {
      for (var index = 0; index < stroke.length - 1; index++) {
        segments.add((stroke[index], stroke[index + 1]));
      }
    }
    if (segments.isEmpty) return 0;
    final samples = <Offset>[];
    for (final stroke in scale(size)) {
      for (var index = 0; index < stroke.length - 1; index++) {
        for (var sample = 0; sample <= 16; sample++) {
          samples.add(
            Offset.lerp(stroke[index], stroke[index + 1], sample / 16)!,
          );
        }
      }
    }
    final tolerance = size.shortestSide * .075;
    final covered = samples.where(
      (sample) => segments.any(
        (segment) =>
            _distanceToSegment(sample, segment.$1, segment.$2) <= tolerance,
      ),
    );
    return covered.length / samples.length;
  }

  static double _distanceToSegment(Offset point, Offset start, Offset end) {
    final delta = end - start;
    final lengthSquared = delta.dx * delta.dx + delta.dy * delta.dy;
    if (lengthSquared == 0) return (point - start).distance;
    final projection =
        ((point.dx - start.dx) * delta.dx + (point.dy - start.dy) * delta.dy) /
        lengthSquared;
    final fraction = math.max(0.0, math.min(1.0, projection));
    return (point -
            Offset(
              start.dx + delta.dx * fraction,
              start.dy + delta.dy * fraction,
            ))
        .distance;
  }
}
