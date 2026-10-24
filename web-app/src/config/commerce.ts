import { Capacitor } from '@capacitor/core';

export const IOS_PREMIUM_MONTHLY_PRODUCT_ID = 'rs.slovolov.app.premium.monthly';
export const FAMILY_PRODUCT_ID = 'slovolov_family_unlock';
export const PREMIUM_MONTHLY_PRICE = '3,99 €';
export const PREMIUM_TRIAL_DAYS = 7;

export function isIosPremiumEnabled(): boolean {
  if (Capacitor.getPlatform() !== 'ios') return false;
  if (import.meta.env.VITE_IOS_PREMIUM_ENABLED === 'true') return true;
  return new URLSearchParams(window.location.search).get('slovolov-premium') === 'ios';
}

export function isCommerceEnabled(): boolean {
  const platform = Capacitor.getPlatform();
  if (platform === 'ios') return isIosPremiumEnabled();
  if (platform === 'android') return import.meta.env.VITE_COMMERCE_ENABLED === 'true';
  return false;
}
