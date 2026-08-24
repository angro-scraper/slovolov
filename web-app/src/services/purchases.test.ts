import { describe, expect, it, vi } from 'vitest';
import {
  IOS_PREMIUM_MONTHLY_PRODUCT_ID,
  createNativePurchaseGatewayWhenReady,
  createPurchaseManager,
  friendlyStoreMessage,
  purchaseOfferFromProduct,
  type PurchaseGateway
} from './purchases';

function gateway(overrides: Partial<PurchaseGateway> = {}): PurchaseGateway {
  return {
    initialize: vi.fn().mockResolvedValue({ available: true, owned: false, ownershipChecked: true, price: '4,99 €' }),
    purchase: vi.fn().mockResolvedValue({ state: 'cancelled' }),
    restore: vi.fn().mockResolvedValue({ owned: false, ownershipChecked: true }),
    ...overrides
  };
}

describe('Slovolov Premium pretplata', () => {
  it('koristi stabilan iOS subscription product ID', () => {
    expect(IOS_PREMIUM_MONTHLY_PRODUCT_ID).toBe('rs.slovolov.app.premium.monthly');
  });
  it('prikazuje samo cenu i probni period koje StoreKit stvarno vrati', () => {
    expect(purchaseOfferFromProduct({
      getOffer: () => ({
        pricingPhases: [
          { price: '0,00 €', billingPeriod: 'P1W', paymentMode: 'FreeTrial' },
          { price: '3,99 €', billingPeriod: 'P1M', paymentMode: 'PayAsYouGo' }
        ]
      })
    }, false)).toEqual({ available: true, owned: false, ownershipChecked: true, price: '3,99 €', trialDays: 7 });

    expect(purchaseOfferFromProduct({
      getOffer: () => ({
        pricingPhases: [{ price: '3,99 €', billingPeriod: 'P1M', paymentMode: 'PayAsYouGo' }]
      })
    }, false)).toEqual({ available: true, owned: false, ownershipChecked: true, price: '3,99 €' });
    expect(purchaseOfferFromProduct({
      getOffer: () => ({ pricingPhases: [] })
    }, false)).toMatchObject({ available: false, owned: false, retryable: true });
  });

  it('ne prikazuje sirovu App Store #400 grešku i dozvoljava novu proveru', () => {
    expect(friendlyStoreMessage('Product not found in AppStore. #400')).toMatch(/Ponovite proveru/i);
    expect(friendlyStoreMessage('Product not found in AppStore. #400')).not.toContain('#400');
  });

  it('ne otključava sadržaj kada je kupovina otkazana ili pending', async () => {
    const syncAccess = vi.fn();
    const cancelled = createPurchaseManager(gateway(), syncAccess);
    expect(await cancelled.purchase()).toMatchObject({ state: 'cancelled' });
    expect(syncAccess).not.toHaveBeenCalled();

    const pending = createPurchaseManager(
      gateway({ purchase: vi.fn().mockResolvedValue({ state: 'pending' }) }),
      syncAccess
    );
    expect(await pending.purchase()).toMatchObject({ state: 'pending' });
    expect(syncAccess).not.toHaveBeenCalled();
  });

  it('otključava tek posle potvrđenog store vlasništva', async () => {
    const syncAccess = vi.fn();
    const manager = createPurchaseManager(
      gateway({ purchase: vi.fn().mockResolvedValue({ state: 'verified' }) }),
      syncAccess
    );
    await manager.purchase();
    expect(syncAccess).toHaveBeenCalledWith(true);
  });

  it('restore vraća kupovinu, ali ne izmišlja uspeh kada proizvod nije kupljen', async () => {
    const syncAccess = vi.fn();
    const restored = createPurchaseManager(
      gateway({ restore: vi.fn().mockResolvedValue({ owned: true, ownershipChecked: true }) }),
      syncAccess
    );
    expect(await restored.restore()).toEqual({ owned: true, ownershipChecked: true });
    expect(syncAccess).toHaveBeenCalledWith(true);

    syncAccess.mockClear();
    const missing = createPurchaseManager(gateway(), syncAccess);
    expect(await missing.restore()).toEqual({ owned: false, ownershipChecked: true });
    expect(syncAccess).toHaveBeenCalledWith(false);
  });

  it('ponovno proverava entitlement na otvaranju i povlači pristup kada je pretplata istekla', async () => {
    const syncAccess = vi.fn();
    const manager = createPurchaseManager(gateway({ initialize: vi.fn().mockResolvedValue({ available: true, owned: false, ownershipChecked: true }) }), syncAccess);
    await manager.initialize();
    expect(syncAccess).toHaveBeenCalledWith(false);
  });

  it('ne briše sačuvanu pretplatu dok StoreKit još nije pouzdano proverio receipt', async () => {
    const syncAccess = vi.fn();
    const manager = createPurchaseManager(gateway({
      initialize: vi.fn().mockResolvedValue({ available: false, owned: false, ownershipChecked: false }),
      restore: vi.fn().mockResolvedValue({ owned: false, ownershipChecked: false, message: 'Privremena greška' })
    }), syncAccess);

    await manager.initialize();
    await manager.restore();

    expect(syncAccess).not.toHaveBeenCalled();
  });

  it('sinhronizuje potvrđeno StoreKit vlasništvo čim stigne receipt događaj', () => {
    const syncAccess = vi.fn();
    let ownershipListener: ((owned: boolean) => void) | undefined;
    const manager = createPurchaseManager(gateway({
      subscribeOwnership: (listener) => {
        ownershipListener = listener;
        return () => undefined;
      }
    }), syncAccess);

    manager.subscribeOwnership();
    ownershipListener?.(true);

    expect(syncAccess).toHaveBeenCalledWith(true);
  });

  it('čeka iOS deviceready umesto da trajno zapamti web gateway', async () => {
    vi.stubGlobal('CdvPurchase', undefined);
    let receiptsReady: (() => void) | undefined;
    const product = {
      pricing: { price: '3,99 €' },
      getOffer: () => ({
        pricingPhases: [
          { price: '0,00 €', billingPeriod: 'P1W', paymentMode: 'FreeTrial' },
          { price: '3,99 €', billingPeriod: 'P1M', paymentMode: 'PayAsYouGo' }
        ]
      })
    };
    const whenApi = {
      receiptsReady: vi.fn((listener: () => void) => {
        receiptsReady = listener;
        return whenApi;
      }),
      receiptUpdated: vi.fn(() => whenApi),
      approved: vi.fn(() => whenApi)
    };
    const store = {
      register: vi.fn(),
      initialize: vi.fn(async () => {
        queueMicrotask(() => receiptsReady?.());
        return [];
      }),
      update: vi.fn().mockResolvedValue(undefined),
      get: vi.fn(() => product),
      owned: vi.fn(() => false),
      when: vi.fn(() => whenApi),
      off: vi.fn(),
      order: vi.fn(),
      restorePurchases: vi.fn(),
      minTimeBetweenUpdates: 600_000
    };

    const gateway = createNativePurchaseGatewayWhenReady(1_000);
    const initializing = gateway.initialize();
    vi.stubGlobal('CdvPurchase', {
      Platform: { APPLE_APPSTORE: 'ios-appstore' },
      ProductType: { PAID_SUBSCRIPTION: 'paid subscription' },
      ErrorCode: { PAYMENT_CANCELLED: 1 },
      store
    });
    document.dispatchEvent(new Event('deviceready'));

    await expect(initializing).resolves.toMatchObject({
      available: true,
      price: '3,99 €',
      trialDays: 7
    });
    expect(store.initialize).toHaveBeenCalledTimes(1);
    expect(store.register).toHaveBeenCalledWith(expect.objectContaining({
      id: IOS_PREMIUM_MONTHLY_PRODUCT_ID
    }));
    vi.unstubAllGlobals();
  });
});
