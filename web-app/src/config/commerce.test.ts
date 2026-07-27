import { afterEach, describe, expect, it, vi } from 'vitest';
import { isCommerceEnabled } from './commerce';

describe('Slovolov store release prekidač', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('ostavlja sadržaj potpuno dostupan kada store izdanje nije eksplicitno uključeno', () => {
    expect(isCommerceEnabled()).toBe(false);
  });

  it('uključuje prodajne granice samo za eksplicitni store build', () => {
    vi.stubEnv('VITE_COMMERCE_ENABLED', 'true');
    expect(isCommerceEnabled()).toBe(true);
  });
});
