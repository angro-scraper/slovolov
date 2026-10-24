import { afterEach, describe, expect, it, vi } from 'vitest';
import { Capacitor } from '@capacitor/core';
import { FAMILY_PRODUCT_ID, IOS_PREMIUM_MONTHLY_PRODUCT_ID, isCommerceEnabled } from './commerce';

describe('Slovolov store release prekidač', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('ostavlja sadržaj potpuno dostupan kada store izdanje nije eksplicitno uključeno', () => {
    expect(isCommerceEnabled()).toBe(false);
  });

  it('uključuje prodajne granice samo za eksplicitni store build', () => {
    vi.spyOn(Capacitor, 'getPlatform').mockReturnValue('ios');
    vi.stubEnv('VITE_IOS_PREMIUM_ENABLED', 'true');
    expect(isCommerceEnabled()).toBe(true);
  });

  it('zadržava Google Play prodaju odvojeno od iOS pretplate', () => {
    vi.spyOn(Capacitor, 'getPlatform').mockReturnValue('android');
    vi.stubEnv('VITE_COMMERCE_ENABLED', 'true');
    expect(isCommerceEnabled()).toBe(true);
    expect(FAMILY_PRODUCT_ID).toBe('slovolov_family_unlock');
    expect(IOS_PREMIUM_MONTHLY_PRODUCT_ID).toBe('rs.slovolov.app.premium.monthly');
  });

  it('ne uključuje iOS pretplatu na Androidu samo zato što je iOS zastavica postavljena', () => {
    vi.spyOn(Capacitor, 'getPlatform').mockReturnValue('android');
    vi.stubEnv('VITE_IOS_PREMIUM_ENABLED', 'true');
    expect(isCommerceEnabled()).toBe(false);
  });
});
