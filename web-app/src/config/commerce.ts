/**
 * Jedini plaćeni proizvod u iOS izdanju. Apple App Store Connect mora koristiti
 * potpuno isti identifikator za auto-renewable subscription.
 */
export const IOS_PREMIUM_MONTHLY_PRODUCT_ID = 'rs.slovolov.app.premium.monthly';
export const PREMIUM_MONTHLY_PRICE = '3,99 €';
export const PREMIUM_TRIAL_DAYS = 7;

/**
 * Trgovina se uključuje isključivo u iOS Store buildu. Javna PWA i Android
 * zatvoreno testiranje nikada ne prikazuju zaključavanje sadržaja niti plaćanje.
 */
export function isIosPremiumEnabled(): boolean {
  if (Capacitor.getPlatform() !== 'ios') return false;
  if (import.meta.env.VITE_IOS_PREMIUM_ENABLED === 'true') return true;
  return new URLSearchParams(window.location.search).get('slovolov-premium') === 'ios';
}

export function isCommerceEnabled(): boolean {
  return isIosPremiumEnabled();
}
import { Capacitor } from '@capacitor/core';
