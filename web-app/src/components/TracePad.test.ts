import { describe, expect, it } from 'vitest';
import { evaluateTrace, type TracePoint } from './TracePad';

describe('provera pisanja slova', () => {
  it('odbija kratko šaranje u jednom uglu', () => {
    const points: TracePoint[] = Array.from({ length: 30 }, (_, index) => ({
      x: 20 + index % 4,
      y: 20 + index % 5
    }));

    expect(evaluateTrace(points, 300, 300).success).toBe(false);
  });

  it('prihvata potez koji prolazi kroz celo polje slova', () => {
    const points: TracePoint[] = Array.from({ length: 60 }, (_, index) => ({
      x: 45 + (index / 59) * 210,
      y: index < 30 ? 250 - (index / 29) * 200 : 50 + ((index - 30) / 29) * 200
    }));

    const result = evaluateTrace(points, 300, 300);
    expect(result.success).toBe(true);
    expect(result.coverageX).toBeGreaterThan(0.6);
    expect(result.coverageY).toBeGreaterThan(0.6);
  });
});
