import { Capacitor } from '@capacitor/core';
import 'cordova-plugin-purchase';
import { IOS_PREMIUM_MONTHLY_PRODUCT_ID, isCommerceEnabled } from '../config/commerce';

export { IOS_PREMIUM_MONTHLY_PRODUCT_ID };

export type PurchaseOffer = {
  available: boolean;
  owned: boolean;
  price?: string;
  trialDays?: number;
  reason?: string;
  retryable?: boolean;
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

type PricingPhaseLike = {
  price?: string;
  billingPeriod?: string;
  paymentMode?: string;
};

type StoreProductLike = {
  pricing?: { price?: string };
  getOffer(): { pricingPhases?: PricingPhaseLike[] } | undefined;
};

function trialDaysFromBillingPeriod(period?: string): number | undefined {
  if (!period) return undefined;
  const days = /^P(\d+)D$/.exec(period)?.[1];
  if (days) return Number(days);
  const weeks = /^P(\d+)W$/.exec(period)?.[1];
  if (weeks) return Number(weeks) * 7;
  return undefined;
}

export function friendlyStoreMessage(message?: string): string {
  const normalized = message?.toLocaleLowerCase('en') ?? '';
  if (normalized.includes('product not found') || normalized.includes('#400')) {
    return 'Apple ponuda još nije učitana. Proverite internet vezu i ponovite proveru za nekoliko minuta.';
  }
  return message || 'Apple prodavnica trenutno nije dostupna. Ponovite proveru.';
}

export function purchaseOfferFromProduct(
  product: StoreProductLike | undefined,
  owned: boolean,
  unavailableReason?: string
): PurchaseOffer {
  const offer = product?.getOffer();
  if (!offer) {
    return {
      available: false,
      owned,
      reason: friendlyStoreMessage(unavailableReason || 'Slovolov Premium ponuda još nije učitana iz App Store-a.'),
      retryable: true
    };
  }

  const phases = offer.pricingPhases ?? [];
  const freeTrial = phases.find((phase) => phase.paymentMode === 'FreeTrial');
  const paidPhase = [...phases].reverse().find((phase) => phase.paymentMode !== 'FreeTrial');
  const trialDays = trialDaysFromBillingPeriod(freeTrial?.billingPeriod);
  const price = paidPhase?.price ?? product?.pricing?.price;

  if (!price) {
    return {
      available: false,
      owned,
      reason: 'Apple ponuda još nema potvrđenu cenu. Ponovite proveru ponude.',
      retryable: true
    };
  }

  return {
    available: true,
    owned,
    price,
    ...(trialDays ? { trialDays } : {})
  };
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
  let initializationPromise: Promise<CdvPurchase.IError[]> | null = null;

  const product = () => store.get(IOS_PREMIUM_MONTHLY_PRODUCT_ID, platform);
  const ownsProduct = () => store.owned({ id: IOS_PREMIUM_MONTHLY_PRODUCT_ID, platform });
  const forceStoreUpdate = async () => {
    const previousMinimum = store.minTimeBetweenUpdates;
    store.minTimeBetweenUpdates = 0;
    try {
      await store.update();
    } finally {
      store.minTimeBetweenUpdates = previousMinimum;
    }
  };
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
    let failureMessage: string | undefined;
    if (!initialized) {
      if (!initializationPromise) {
        store.register({
          id: IOS_PREMIUM_MONTHLY_PRODUCT_ID,
          type: CdvPurchase.ProductType.PAID_SUBSCRIPTION,
          platform
        });
        store.when().approved((transaction) => transaction.finish());
        initializationPromise = store.initialize([platform]);
      }
      const errors = await initializationPromise;
      initialized = true;
      const fatal = errors.find((error) => error.productId === IOS_PREMIUM_MONTHLY_PRODUCT_ID || error.platform === platform);
      failureMessage = fatal?.message;
    } else {
      // Biblioteka inače preskače StoreKit pozive do deset minuta. Korisnički
      // retry mora zaista ponovo da proveri Apple ponudu odmah.
      await forceStoreUpdate();
    }

    return purchaseOfferFromProduct(product(), ownsProduct(), failureMessage);
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
      await forceStoreUpdate();
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
      await forceStoreUpdate();
      return {
        owned: ownsProduct(),
        message: ownsProduct() ? undefined : 'Kupovina nije pronađena na ovom nalogu.'
      };
    }
  };
}

let defaultNativeGateway: PurchaseGateway | null = null;

export function createDefaultPurchaseGateway(): PurchaseGateway {
  if (!isCommerceEnabled() || Capacitor.getPlatform() !== 'ios' || typeof CdvPurchase === 'undefined') return webGateway();
  defaultNativeGateway ??= nativeGateway();
  return defaultNativeGateway;
}

export function isNativePurchasePlatform(): boolean {
  return Capacitor.isNativePlatform();
}
