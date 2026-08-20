import { Capacitor } from '@capacitor/core';
import 'cordova-plugin-purchase';
import { IOS_PREMIUM_MONTHLY_PRODUCT_ID, isCommerceEnabled } from '../config/commerce';

export { IOS_PREMIUM_MONTHLY_PRODUCT_ID };

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
  setSubscriptionAccess: (isUnlocked: boolean) => void
) {
  return {
    initialize: async () => {
      const offer = await gateway.initialize();
      setSubscriptionAccess(offer.owned);
      return offer;
    },
    purchase: async () => {
      const result = await gateway.purchase();
      if (result.state === 'verified') setSubscriptionAccess(true);
      return result;
    },
    restore: async () => {
      const result = await gateway.restore();
      setSubscriptionAccess(result.owned);
      return result;
    }
  };
}

function webGateway(): PurchaseGateway {
  const reason = 'Slovolov Premium je trenutno dostupan samo u iOS aplikaciji.';
  return {
    initialize: async () => ({ available: false, owned: false, reason }),
    purchase: async () => ({ state: 'unavailable', message: reason }),
    restore: async () => ({ owned: false, message: reason })
  };
}

function nativeGateway(): PurchaseGateway {
  const platform = CdvPurchase.Platform.APPLE_APPSTORE;
  const store = CdvPurchase.store;
  let initialized = false;

  const product = () => store.get(IOS_PREMIUM_MONTHLY_PRODUCT_ID, platform);
  const ownsProduct = () => store.owned({ id: IOS_PREMIUM_MONTHLY_PRODUCT_ID, platform });
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
        id: IOS_PREMIUM_MONTHLY_PRODUCT_ID,
        type: CdvPurchase.ProductType.PAID_SUBSCRIPTION,
        platform
      });
      store.when().approved((transaction) => transaction.finish());
      const errors = await store.initialize([platform]);
      initialized = true;
      const fatal = errors.find((error) => error.productId === IOS_PREMIUM_MONTHLY_PRODUCT_ID || error.platform === platform);
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
      reason: loaded ? undefined : 'Slovolov Premium pretplata još nije podešena u App Store-u.'
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
      await initialize();
      // Vraćanje mora biti dostupno i kada App Store još nije učitao trenutnu ponudu.
      // Ranija aktivna pretplata može da postoji i tada.
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
  if (!isCommerceEnabled() || Capacitor.getPlatform() !== 'ios' || typeof CdvPurchase === 'undefined') return webGateway();
  return nativeGateway();
}

export function isNativePurchasePlatform(): boolean {
  return Capacitor.isNativePlatform();
}
