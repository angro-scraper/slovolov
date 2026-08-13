import { afterEach, describe, expect, it, vi } from 'vitest';
import { Capacitor } from '@capacitor/core';
import { IOS_PREMIUM_MONTHLY_PRODUCT_ID, PREMIUM_MONTHLY_PRICE, PREMIUM_TRIAL_DAYS, isCommerceEnabled } from './commerce';

describe('Slovolov store release prekidač', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    window.history.replaceState({}, '', '/');
  });

  it('ostavlja sadržaj potpuno dostupan kada store izdanje nije eksplicitno uključeno', () => {
    expect(isCommerceEnabled()).toBe(false);
  });

  it('uključuje iOS Premium samo za eksplicitni iOS Store build', () => {
    vi.spyOn(Capacitor, 'getPlatform').mockReturnValue('ios');
    vi.stubEnv('VITE_IOS_PREMIUM_ENABLED', 'true');
    expect(isCommerceEnabled()).toBe(true);
  });

  it('ne uključuje iOS Premium na Androidu čak ni kada je Store build promenljiva postavljena', () => {
    vi.spyOn(Capacitor, 'getPlatform').mockReturnValue('android');
    vi.stubEnv('VITE_IOS_PREMIUM_ENABLED', 'true');
    expect(isCommerceEnabled()).toBe(false);
  });

  it('ima stabilan mesečni iOS proizvod, cenu i period probe', () => {
    expect(IOS_PREMIUM_MONTHLY_PRODUCT_ID).toBe('rs.slovolov.app.premium.monthly');
    expect(PREMIUM_MONTHLY_PRICE).toBe('3,99 €');
    expect(PREMIUM_TRIAL_DAYS).toBe(7);
  });
});
