import { Capacitor } from '@capacitor/core';
import 'cordova-plugin-purchase';
import { FAMILY_PRODUCT_ID, isCommerceEnabled } from '../config/commerce';

export { FAMILY_PRODUCT_ID };

export type PurchaseOffer = {
  available: boolean;
  owned: boolean;
  price?: string;
  reason?: string;
};

export type PurchaseResult = {
  state: 'verified' | 'pending' | 'cancelled' | 'unavailable' | 'failed';
  message?: string;
};

export type RestoreResult = {
  owned: boolean;
  message?: string;
};

export interface PurchaseGateway {
  initialize(): Promise<PurchaseOffer>;
  purchase(): Promise<PurchaseResult>;
  restore(): Promise<RestoreResult>;
}

export function createPurchaseManager(
  gateway: PurchaseGateway,
  grantAccess: (source: 'store') => void
) {
  return {
    initialize: async () => {
      const offer = await gateway.initialize();
      if (offer.owned) grantAccess('store');
      return offer;
    },
    purchase: async () => {
      const result = await gateway.purchase();
      if (result.state === 'verified') grantAccess('store');
      return result;
    },
    restore: async () => {
      const result = await gateway.restore();
      if (result.owned) grantAccess('store');
      return result;
    }
  };
}

function webGateway(): PurchaseGateway {
  const reason = 'Kupovina je dostupna u instaliranoj Android/iOS aplikaciji.';
  return {
    initialize: async () => ({ available: false, owned: false, reason }),
    purchase: async () => ({ state: 'unavailable', message: reason }),
    restore: async () => ({ owned: false, message: reason })
  };
}

function nativeGateway(): PurchaseGateway {
  const platform = Capacitor.getPlatform() === 'ios'
    ? CdvPurchase.Platform.APPLE_APPSTORE
    : CdvPurchase.Platform.GOOGLE_PLAY;
  const store = CdvPurchase.store;
  let initialized = false;

  const product = () => store.get(FAMILY_PRODUCT_ID, platform);
  const ownsProduct = () => store.owned({ id: FAMILY_PRODUCT_ID, platform });
  const waitForOwnership = async (timeoutMs = 15_000): Promise<boolean> => {
    if (ownsProduct()) return true;
    return new Promise((resolve) => {
      let settled = false;
      const finish = (owned: boolean) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        store.off(onReceipt);
        resolve(owned);
      };
      const onReceipt = () => {
        if (ownsProduct()) finish(true);
      };
      const timer = window.setTimeout(() => finish(ownsProduct()), timeoutMs);
      store.when().receiptUpdated(onReceipt);
    });
  };

  async function initialize(): Promise<PurchaseOffer> {
    if (!initialized) {
      store.register({
        id: FAMILY_PRODUCT_ID,
        type: CdvPurchase.ProductType.NON_CONSUMABLE,
        platform
      });
      store.when().approved((transaction) => transaction.finish());
      const errors = await store.initialize([platform]);
      initialized = true;
      const fatal = errors.find((error) => error.productId === FAMILY_PRODUCT_ID || error.platform === platform);
      if (fatal) {
        return { available: false, owned: false, reason: fatal.message };
      }
    } else {
      await store.update();
    }

    const loaded = product();
    return {
      available: Boolean(loaded?.getOffer()),
      owned: ownsProduct(),
      price: loaded?.pricing?.price,
      reason: loaded ? undefined : 'Slovolov Family proizvod još nije podešen u prodavnici.'
    };
  }

  return {
    initialize,
    purchase: async () => {
      const offerState = await initialize();
      if (offerState.owned) return { state: 'verified' };
      const offer = product()?.getOffer();
      if (!offer) return { state: 'unavailable', message: offerState.reason };

      const error = await store.order(offer);
      if (error) {
        const cancelled = error.code === CdvPurchase.ErrorCode.PAYMENT_CANCELLED;
        return { state: cancelled ? 'cancelled' : 'failed', message: error.message };
      }
      await store.update();
      return await waitForOwnership()
        ? { state: 'verified' }
        : { state: 'pending', message: 'Kupovina čeka potvrdu prodavnice.' };
    },
    restore: async () => {
      const offerState = await initialize();
      if (!offerState.available && !offerState.owned) {
        return { owned: false, message: offerState.reason };
      }
      const error = await store.restorePurchases();
      if (error) return { owned: false, message: error.message };
      await store.update();
      return {
        owned: ownsProduct(),
        message: ownsProduct() ? undefined : 'Kupovina nije pronađena na ovom nalogu.'
      };
    }
  };
}

export function createDefaultPurchaseGateway(): PurchaseGateway {
  if (!isCommerceEnabled() || !Capacitor.isNativePlatform() || typeof CdvPurchase === 'undefined') return webGateway();
  return nativeGateway();
}

export function isNativePurchasePlatform(): boolean {
  return Capacitor.isNativePlatform();
}
