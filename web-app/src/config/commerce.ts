export const FAMILY_PRODUCT_ID = 'slovolov_family_unlock';

export function isCommerceEnabled(): boolean {
  return import.meta.env.VITE_COMMERCE_ENABLED === 'true';
}
