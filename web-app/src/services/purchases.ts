import { Capacitor } from '@capacitor/core';
import 'cordova-plugin-purchase';
import { IOS_PREMIUM_MONTHLY_PRODUCT_ID, isCommerceEnabled } from '../config/commerce';

export { IOS_PREMIUM_MONTHLY_PRODUCT_ID };

export type PurchaseOffer = {
  available: boolean;
  owned: boolean;
  /** True tek kada je StoreKit učitao lokalni receipt i vlasništvo je pouzdano provereno. */
  ownershipChecked?: boolean;
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
  ownershipChecked?: boolean;
  message?: string;
};

export interface PurchaseGateway {
  initialize(): Promise<PurchaseOffer>;
  purchase(): Promise<PurchaseResult>;
  restore(): Promise<RestoreResult>;
  subscribeOwnership?(listener: (owned: boolean) => void): () => void;
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
  unavailableReason?: string,
  ownershipChecked = true
): PurchaseOffer {
  const offer = product?.getOffer();
  if (!offer) {
    return {
      available: false,
      owned,
      ownershipChecked,
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
      ownershipChecked,
      reason: 'Apple ponuda još nema potvrđenu cenu. Ponovite proveru ponude.',
      retryable: true
    };
  }

  return {
    available: true,
    owned,
    ownershipChecked,
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
      // StoreKit može kratkotrajno vratiti `owned=false` dok se lokalni receipt
      // još obnavlja posle pokretanja aplikacije. Takav negativan odgovor ne
      // sme da obriše prethodno potvrđen entitlement sa uređaja.
      if (offer.owned) setSubscriptionAccess(true);
      return offer;
    },
    purchase: async () => {
      const result = await gateway.purchase();
      if (result.state === 'verified') setSubscriptionAccess(true);
      return result;
    },
    restore: async () => {
      const result = await gateway.restore();
      if (result.owned || result.ownershipChecked) setSubscriptionAccess(result.owned);
      return result;
    },
    subscribeOwnership: () => gateway.subscribeOwnership?.((owned) => {
      if (owned) setSubscriptionAccess(true);
    }) ?? (() => undefined)
  };
}

function webGateway(): PurchaseGateway {
  const reason = 'Slovolov Premium je trenutno dostupan samo u iOS aplikaciji.';
  return {
    initialize: async () => ({ available: false, owned: false, ownershipChecked: false, reason }),
    purchase: async () => ({ state: 'unavailable', message: reason }),
    restore: async () => ({ owned: false, ownershipChecked: false, message: reason })
  };
}

function hasNativePurchasePlugin(): boolean {
  return typeof CdvPurchase !== 'undefined' && Boolean(CdvPurchase?.store);
}

/**
 * Capacitor može da prikaže udaljeni web ekran pre nego što Cordova završi
 * ubacivanje StoreKit mosta. Ne smemo tada trajno izabrati web gateway.
 */
async function waitForNativePurchasePlugin(timeoutMs: number): Promise<boolean> {
  if (hasNativePurchasePlugin()) return true;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (available: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      window.clearInterval(poll);
      document.removeEventListener('deviceready', check);
      resolve(available);
    };
    const check = () => {
      if (hasNativePurchasePlugin()) finish(true);
    };
    const poll = window.setInterval(check, 50);
    const timeout = window.setTimeout(() => finish(hasNativePurchasePlugin()), timeoutMs);
    document.addEventListener('deviceready', check);
    check();
  });
}

export function createNativePurchaseGatewayWhenReady(pluginTimeoutMs = 10_000): PurchaseGateway {
  let delegate: PurchaseGateway | null = null;
  let resolving: Promise<PurchaseGateway | null> | null = null;
  const unavailableReason = 'Apple kupovina se još povezuje sa aplikacijom. Sačekajte trenutak i ponovite proveru.';

  const resolveDelegate = async (): Promise<PurchaseGateway | null> => {
    if (delegate) return delegate;
    resolving ??= waitForNativePurchasePlugin(pluginTimeoutMs).then((available) => {
      resolving = null;
      if (!available) return null;
      delegate ??= nativeGateway();
      return delegate;
    });
    return resolving;
  };

  return {
    initialize: async () => {
      const gateway = await resolveDelegate();
      if (!gateway) {
        return {
          available: false,
          owned: false,
          ownershipChecked: false,
          reason: unavailableReason,
          retryable: true
        };
      }
      return gateway.initialize();
    },
    purchase: async () => {
      const gateway = await resolveDelegate();
      return gateway
        ? gateway.purchase()
        : { state: 'unavailable', message: unavailableReason };
    },
    restore: async () => {
      const gateway = await resolveDelegate();
      return gateway
        ? gateway.restore()
        : { owned: false, ownershipChecked: false, message: unavailableReason };
    },
    subscribeOwnership: (listener) => {
      let cancelled = false;
      let unsubscribe: () => void = () => undefined;
      void resolveDelegate().then((gateway) => {
        if (!gateway || cancelled) return;
        unsubscribe = gateway.subscribeOwnership?.(listener) ?? (() => undefined);
      });
      return () => {
        cancelled = true;
        unsubscribe();
      };
    }
  };
}

function nativeGateway(): PurchaseGateway {
  const platform = CdvPurchase.Platform.APPLE_APPSTORE;
  const store = CdvPurchase.store;
  let initialized = false;
  let initializationPromise: Promise<CdvPurchase.IError[]> | null = null;
  let receiptsReady = false;
  let resolveReceiptsReady: (() => void) | undefined;
  const receiptsReadyPromise = new Promise<void>((resolve) => {
    resolveReceiptsReady = resolve;
  });
  const ownershipListeners = new Set<(owned: boolean) => void>();

  const product = () => store.get(IOS_PREMIUM_MONTHLY_PRODUCT_ID, platform);
  const ownsProduct = () => store.owned({ id: IOS_PREMIUM_MONTHLY_PRODUCT_ID, platform });
  const notifyOwnership = () => {
    const owned = ownsProduct();
    ownershipListeners.forEach((listener) => listener(owned));
  };
  store.when().receiptsReady(() => {
    receiptsReady = true;
    resolveReceiptsReady?.();
    notifyOwnership();
  });
  store.when().receiptUpdated(() => {
    if (receiptsReady) notifyOwnership();
  });
  const waitForReceiptsReady = async (timeoutMs = 10_000): Promise<boolean> => {
    if (receiptsReady) return true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<false>((resolve) => {
      timer = setTimeout(() => resolve(false), timeoutMs);
    });
    const ready = receiptsReadyPromise.then(() => true as const);
    const result = await Promise.race([ready, timeout]);
    if (timer) clearTimeout(timer);
    return result;
  };
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
      const ownershipChecked = await waitForReceiptsReady();
      const fatal = errors.find((error) => error.productId === IOS_PREMIUM_MONTHLY_PRODUCT_ID || error.platform === platform);
      failureMessage = fatal?.message;
      if (fatal) {
        return purchaseOfferFromProduct(undefined, ownsProduct(), fatal.message, ownershipChecked);
      }
    } else {
      // Biblioteka inače preskače StoreKit pozive do deset minuta. Korisnički
      // retry mora zaista ponovo da proveri Apple ponudu odmah.
      await forceStoreUpdate();
    }

    const ownershipChecked = receiptsReady || await waitForReceiptsReady();
    return purchaseOfferFromProduct(product(), ownsProduct(), failureMessage, ownershipChecked);
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
      if (error) return { owned: ownsProduct(), ownershipChecked: false, message: error.message };
      await forceStoreUpdate();
      return {
        owned: ownsProduct(),
        ownershipChecked: true,
        message: ownsProduct() ? undefined : 'Kupovina nije pronađena na ovom nalogu.'
      };
    },
    subscribeOwnership: (listener) => {
      ownershipListeners.add(listener);
      if (receiptsReady) queueMicrotask(() => listener(ownsProduct()));
      return () => ownershipListeners.delete(listener);
    }
  };
}

let defaultNativeGateway: PurchaseGateway | null = null;

export function createDefaultPurchaseGateway(): PurchaseGateway {
  if (!isCommerceEnabled() || !Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') return webGateway();
  defaultNativeGateway ??= createNativePurchaseGatewayWhenReady();
  return defaultNativeGateway;
}

export function isNativePurchasePlatform(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}
